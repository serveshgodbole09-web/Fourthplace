import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from auth import hash_password
from config import get_settings
from database import Base, SessionLocal, engine, ensure_schema
from limiter import limiter
from models import Admin
from routers import admin, auth as auth_router, customers, feedback, menu, offers, public, spinwheel
from routers.offers import process_due_offers
from services.birthday import send_birthday_perks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fourthplace")
settings = get_settings()
scheduler = BackgroundScheduler()
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

FRONTEND_DIST = Path(__file__).resolve().parent.parent / "frontend" / "dist"


def scheduled_jobs():
    db = SessionLocal()
    try:
        process_due_offers(db)
        send_birthday_perks(db)
    except Exception:
        logger.exception("Scheduled job failed")
    finally:
        db.close()


# --- NEW: creates the admin account from env vars if none exists yet ---
def ensure_admin_exists():
    admin_email = os.environ.get("ADMIN_EMAIL")
    admin_password = os.environ.get("ADMIN_PASSWORD")
    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD not set — skipping admin seed.")
        return

    db = SessionLocal()
    try:
        existing = db.query(Admin).filter(Admin.email == admin_email).first()
        if existing:
            logger.info("Admin already exists: %s", admin_email)
            return
        new_admin = Admin(email=admin_email, hashed_password=hash_password(admin_password))
        db.add(new_admin)
        db.commit()
        logger.info("Created admin account: %s", admin_email)
    except Exception:
        logger.exception("Failed to seed admin account")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    ensure_admin_exists()  # --- NEW ---
    scheduler.add_job(scheduled_jobs, "interval", minutes=15, id="fourthplace-jobs")
    scheduler.start()
    scheduled_jobs()
    yield
    scheduler.shutdown(wait=False)


app = FastAPI(title="Fourth Place API", version="1.0.0", lifespan=lifespan)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="api-uploads")
app.state.limiter = limiter
app.add_middleware(SlowAPIMiddleware)


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(status_code=429, content={"detail": "Slow down — the kettle needs a moment."})


app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(customers.router)
app.include_router(feedback.router)
app.include_router(menu.router)
app.include_router(offers.router)
app.include_router(spinwheel.router)
app.include_router(admin.router)
app.include_router(public.router)
app.include_router(public.wallet)


@app.get("/health")
def health():
    return {"status": "warm"}


if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=FRONTEND_DIST / "assets"), name="frontend-assets")

    @app.get("/{full_path:path}")
    async def serve_frontend(full_path: str):
        if full_path.startswith(("uploads/", "api/", "health")):
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        return FileResponse(FRONTEND_DIST / "index.html")