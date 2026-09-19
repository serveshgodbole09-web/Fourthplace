from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import create_token, get_current_admin, get_current_customer, verify_password
from config import get_settings
from database import get_db
from models import Admin, Customer
from schemas import AdminLogin, CustomerLogin, PublicConfig, TokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])
settings = get_settings()


@router.post("/admin/login", response_model=TokenResponse)
def admin_login(payload: AdminLogin, db: Session = Depends(get_db)):
    admin = db.query(Admin).filter(Admin.email == payload.email.lower().strip()).first()
    if not admin or not verify_password(payload.password, admin.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(admin.email, "admin")
    return TokenResponse(access_token=token, role="admin", admin={"id": admin.id, "email": admin.email})


@router.post("/customer/login", response_model=TokenResponse)
def customer_login(payload: CustomerLogin, db: Session = Depends(get_db)):
    digits = "".join(ch for ch in payload.phone if ch.isdigit() or ch == "+")
    customer = db.query(Customer).filter(Customer.phone == digits).first()
    if not customer:
        raise HTTPException(status_code=404, detail="No membership found for that phone")
    token = create_token(customer.phone, "customer")
    return TokenResponse(
        access_token=token,
        role="customer",
        customer={
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "has_spun": customer.has_spun,
        },
    )


@router.get("/me")
def me_admin(admin=Depends(get_current_admin)):
    return {"role": "admin", "email": admin.email}


@router.get("/customer/me")
def me_customer(customer=Depends(get_current_customer)):
    return {
        "id": customer.id,
        "name": customer.name,
        "phone": customer.phone,
        "has_spun": customer.has_spun,
        "date_of_birth": str(customer.date_of_birth),
    }


@router.get("/public-config", response_model=PublicConfig)
def public_config():
    return PublicConfig(
        google_maps_api_key=settings.google_maps_api_key,
        cafe_map_query=settings.cafe_map_query,
        cafe_lat=settings.cafe_lat,
        cafe_lng=settings.cafe_lng,
    )
