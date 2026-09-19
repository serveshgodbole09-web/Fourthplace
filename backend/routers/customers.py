from datetime import date
import logging

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session

from auth import create_token, get_current_admin
from database import get_db
from models import Customer
from schemas import CustomerOut, CustomerRegister, TokenResponse
from limiter import limiter
from services.birthday import send_birthday_email_to_customer

router = APIRouter(prefix="/customers", tags=["customers"])
logger = logging.getLogger("fourthplace.customers")


@router.post("/register", response_model=TokenResponse)
@limiter.limit("8/minute")
def register(request: Request, payload: CustomerRegister, db: Session = Depends(get_db)):
    existing = db.query(Customer).filter(Customer.phone == payload.phone).first()
    if existing:
        raise HTTPException(status_code=409, detail="This phone is already registered. Sign in instead.")
    customer = Customer(
        name=payload.name.strip(),
        phone=payload.phone,
        email=str(payload.email).lower(),
        date_of_birth=payload.date_of_birth,
        newsletter_opt_in=payload.newsletter_opt_in,
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)
    if customer.date_of_birth.month == date.today().month and customer.date_of_birth.day == date.today().day:
        try:
            send_birthday_email_to_customer(db, customer.id)
        except ValueError as exc:
            logger.info("Birthday email skipped for new customer %s: %s", customer.id, exc)
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


@router.get("/lookup", response_model=CustomerOut)
def lookup(phone: str = Query(...), db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    digits = "".join(ch for ch in phone if ch.isdigit() or ch == "+")
    customer = db.query(Customer).filter(Customer.phone == digits).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Not found")
    return customer
from datetime import date
import logging
