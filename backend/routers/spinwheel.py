import random

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from auth import get_current_customer
from database import get_db
from limiter import limiter
from models import Customer, SpinResult
from schemas import SpinResponse
from services.coupons import create_coupon

router = APIRouter(prefix="/spinwheel", tags=["spinwheel"])

# Fair spin: every prize has the same chance.
PRIZES = [
    {"code": "off20", "label": "20% off", "discount": "20% off your bill", "weight": 1, "win": True},
    {"code": "off15", "label": "15% off", "discount": "15% off drinks", "weight": 1, "win": True},
    {"code": "off10", "label": "10% off", "discount": "10% off any item", "weight": 1, "win": True},
    {"code": "off5", "label": "5% off", "discount": "5% off pastry", "weight": 1, "win": True},
    {"code": "try_again", "label": "Try the specials", "discount": "No coupon this round", "weight": 1, "win": False},
    {"code": "free_coffee", "label": "Free coffee", "discount": "Free drip or espresso", "weight": 1, "win": True},
]


def pick_prize() -> dict:
    total_weight = sum(prize["weight"] for prize in PRIZES)
    roll = random.uniform(0, total_weight)
    cursor = 0.0
    for prize in PRIZES:
        cursor += prize["weight"]
        if roll <= cursor:
            return prize
    return PRIZES[-1]


@router.get("/prizes")
def prizes():
    return [{"label": p["label"], "code": p["code"], "win": p["win"]} for p in PRIZES]


@router.post("/spin", response_model=SpinResponse)
@limiter.limit("10/minute")
def spin(request: Request, db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    existing = db.query(SpinResult).filter(SpinResult.customer_id == customer.id).first()
    if existing or customer.has_spun:
        coupon = None
        if existing and existing.is_win:
            from models import Coupon

            coupon_row = (
                db.query(Coupon)
                .filter(Coupon.customer_id == customer.id, Coupon.source == "spin")
                .order_by(Coupon.id.desc())
                .first()
            )
            coupon = (
                {
                    "code": coupon_row.code,
                    "label": coupon_row.label,
                    "discount": coupon_row.discount,
                }
                if coupon_row
                else None
            )
        return SpinResponse(
            prize_label=existing.prize_label if existing else "Already spun",
            prize_code=existing.prize_code if existing else "spent",
            is_win=bool(existing and existing.is_win),
            coupon=coupon,
            already_spun=True,
        )

    prize = pick_prize()
    result = SpinResult(
        customer_id=customer.id,
        prize_label=prize["label"],
        prize_code=prize["code"],
        is_win=prize["win"],
    )
    customer.has_spun = True
    db.add(result)
    db.add(customer)
    try:
        db.commit()
    except Exception as exc:  # unique constraint race
        db.rollback()
        raise HTTPException(status_code=409, detail="You already used your spin") from exc

    coupon_payload = None
    if prize["win"]:
        coupon = create_coupon(db, customer, prize["label"], prize["discount"], "spin")
        coupon_payload = {"code": coupon.code, "label": coupon.label, "discount": coupon.discount}

    return SpinResponse(
        prize_label=prize["label"],
        prize_code=prize["code"],
        is_win=prize["win"],
        coupon=coupon_payload,
        already_spun=False,
    )
