from collections import defaultdict
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, Query, UploadFile
from sqlalchemy import func
from sqlalchemy.orm import Session

from auth import get_current_admin, get_current_customer
from database import get_db
from models import ArtistOfMonth, Coupon, Customer, Feedback, GalleryImage, LoyaltyCard, SpinResult
from schemas import AnalyticsOut, ArtistOut, CouponOut, CustomerOut, FeedbackOut, GalleryIn, GalleryOut, LoyaltyStampOut
from services.birthday import send_birthday_email_to_customer, send_birthday_perks

router = APIRouter(prefix="/admin", tags=["admin"])
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
ALLOWED_IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp", "image/gif": ".gif"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


@router.post("/upload")
async def upload_image(file: UploadFile = File(...), _admin=Depends(get_current_admin)):
    extension = ALLOWED_IMAGE_TYPES.get(file.content_type or "")
    if not extension:
        raise HTTPException(status_code=400, detail="Upload a JPG, PNG, WEBP, or GIF image")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be 5 MB or smaller")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    filename = f"{uuid4().hex}{extension}"
    (UPLOAD_DIR / filename).write_bytes(content)
    return {"url": f"/api/uploads/{filename}", "filename": filename}


@router.get("/customers", response_model=list[CustomerOut])
def customers(
    q: str | None = Query(None),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    query = db.query(Customer)
    if q:
        like = f"%{q.strip()}%"
        query = query.filter((Customer.name.ilike(like)) | (Customer.phone.ilike(like)))
    return query.order_by(Customer.created_at.desc()).all()


@router.post("/customers/{customer_id}/reset-stamps")
def reset_customer_stamps(customer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Guest not found")
    db.query(SpinResult).filter(SpinResult.customer_id == customer.id).delete(synchronize_session=False)
    db.query(Coupon).filter(Coupon.customer_id == customer.id, Coupon.source == "spin").delete(
        synchronize_session=False
    )
    customer.has_spun = False
    db.commit()
    return {"ok": True}


@router.post("/customers/{customer_id}/loyalty-stamp", response_model=LoyaltyStampOut)
def loyalty_stamp(customer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Guest not found")
    card = db.query(LoyaltyCard).filter(LoyaltyCard.customer_id == customer_id).first()
    if not card:
        card = LoyaltyCard(customer_id=customer_id)
        db.add(card)
        db.flush()
    if card.stamps < card.goal:
        card.stamps += 1
    db.commit()
    db.refresh(card)
    return {
        "id": card.id,
        "stamps": card.stamps,
        "goal": card.goal,
        "reward": card.reward,
        "message": "Reward unlocked." if card.stamps == card.goal else "Stamp added.",
    }


@router.post("/customers/{customer_id}/loyalty-reset")
def loyalty_reset(customer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Guest not found")
    card = db.query(LoyaltyCard).filter(LoyaltyCard.customer_id == customer_id).first()
    if not card or card.stamps < card.goal:
        raise HTTPException(status_code=400, detail="The loyalty card must be full before it can be reset")
    db.query(SpinResult).filter(SpinResult.customer_id == customer_id).delete(synchronize_session=False)
    db.query(Coupon).filter(Coupon.customer_id == customer_id, Coupon.source == "spin").delete(
        synchronize_session=False
    )
    card.stamps = 0
    customer.has_spun = False
    db.commit()
    return {"ok": True, "message": "Loyalty card reset. The customer can spin again."}


@router.delete("/customers/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Guest not found")
    db.query(Feedback).filter(Feedback.customer_id == customer.id).delete(synchronize_session=False)
    db.query(SpinResult).filter(SpinResult.customer_id == customer.id).delete(synchronize_session=False)
    db.query(Coupon).filter(Coupon.customer_id == customer.id).delete(synchronize_session=False)
    db.query(LoyaltyCard).filter(LoyaltyCard.customer_id == customer.id).delete(synchronize_session=False)
    db.delete(customer)
    db.commit()
    return {"ok": True}


@router.get("/feedback", response_model=list[FeedbackOut])
def feedback(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    return db.query(Feedback).order_by(Feedback.created_at.desc()).all()


@router.delete("/feedback/{feedback_id}")
def delete_feedback(feedback_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    row = db.query(Feedback).filter(Feedback.id == feedback_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Guestbook note not found")
    db.delete(row)
    db.commit()
    return {"ok": True}


@router.get("/analytics", response_model=AnalyticsOut)
def analytics(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    feedback_count = db.query(func.count(Feedback.id)).scalar() or 0
    avg = db.query(func.avg(Feedback.rating)).scalar() or 0
    spin_total = db.query(func.count(SpinResult.id)).scalar() or 0
    spin_wins = db.query(func.count(SpinResult.id)).filter(SpinResult.is_win.is_(True)).scalar() or 0

    breakdown = defaultdict(int)
    for row in db.query(SpinResult.prize_label, func.count(SpinResult.id)).group_by(SpinResult.prize_label):
        breakdown[row[0]] = int(row[1])

    trend = []
    today = datetime.utcnow().date()
    for i in range(13, -1, -1):
        day = today - timedelta(days=i)
        start = datetime.combine(day, datetime.min.time())
        end = datetime.combine(day, datetime.max.time())
        count = (
            db.query(func.count(Feedback.id))
            .filter(Feedback.created_at >= start, Feedback.created_at <= end)
            .scalar()
            or 0
        )
        trend.append({"date": day.isoformat(), "count": int(count)})

    return AnalyticsOut(
        total_customers=int(total_customers),
        average_rating=round(float(avg), 2) if feedback_count else 0,
        feedback_count=int(feedback_count),
        spin_wins=int(spin_wins),
        spin_total=int(spin_total),
        prize_breakdown=dict(breakdown),
        feedback_trend=trend,
    )


@router.get("/gallery", response_model=list[GalleryOut])
def admin_gallery(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    return db.query(GalleryImage).order_by(GalleryImage.sort_order, GalleryImage.id).all()


@router.post("/gallery", response_model=GalleryOut)
def add_gallery(payload: GalleryIn, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    row = GalleryImage(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/gallery/{image_id}")
def delete_gallery(image_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    row = db.query(GalleryImage).filter(GalleryImage.id == image_id).first()
    if row:
        db.delete(row)
        db.commit()
    return {"ok": True}


@router.post("/birthday-run")
def birthday_run(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    count = send_birthday_perks(db)
    return {"issued": count}


@router.post("/customers/{customer_id}/birthday-email")
def birthday_email_for_customer(customer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    try:
        return send_birthday_email_to_customer(db, customer_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
