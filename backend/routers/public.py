from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from auth import get_current_customer
from database import get_db
from models import ArtistOfMonth, Coupon, Customer, GalleryImage, LoyaltyCard
from schemas import ArtistOut, CouponOut, GalleryOut, LoyaltyCardOut

router = APIRouter(prefix="/public", tags=["public"])


@router.get("/gallery", response_model=list[GalleryOut])
def gallery(db: Session = Depends(get_db)):
    return db.query(GalleryImage).order_by(GalleryImage.sort_order, GalleryImage.id).all()


@router.get("/artist", response_model=ArtistOut | None)
def artist(db: Session = Depends(get_db)):
    return db.query(ArtistOfMonth).filter(ArtistOfMonth.is_current.is_(True)).first()


wallet = APIRouter(prefix="/wallet", tags=["wallet"])


@wallet.get("/coupons", response_model=list[CouponOut])
def my_coupons(db: Session = Depends(get_db), customer=Depends(get_current_customer)):
    return (
        db.query(Coupon)
        .filter(Coupon.customer_id == customer.id)
        .order_by(Coupon.created_at.desc())
        .all()
    )


@wallet.get("/loyalty", response_model=LoyaltyCardOut)
def my_loyalty(db: Session = Depends(get_db), customer: Customer = Depends(get_current_customer)):
    card = db.query(LoyaltyCard).filter(LoyaltyCard.customer_id == customer.id).first()
    if not card:
        card = LoyaltyCard(customer_id=customer.id)
        db.add(card)
        db.commit()
        db.refresh(card)
    return card
