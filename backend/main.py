import logging
from contextlib import asynccontextmanager
from pathlib import Path

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import get_settings
from database import Base, SessionLocal, engine, ensure_schema
from limiter import limiter
from routers import admin, auth, customers, feedback, menu, offers, public, spinwheel
from routers.offers import process_due_offers
from services.birthday import send_birthday_perks

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fourthplace")
settings = get_settings()
scheduler = BackgroundScheduler()
UPLOAD_DIR = Path(__file__).resolve().parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)


def scheduled_jobs():
    db = SessionLocal()
    try:
        process_due_offers(db)
        send_birthday_perks(db)
    except Exception:
        logger.exception("Scheduled job failed")
    finally:
        db.close()


@asynccontextmanager
async def lifespan(_app: FastAPI):
    Base.metadata.create_all(bind=engine)
    ensure_schema()
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

app.include_router(auth.router)
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
