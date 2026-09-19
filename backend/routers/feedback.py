from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from limiter import limiter
from models import Customer, Feedback
from schemas import FeedbackCreate, FeedbackOut, RatingSummary

router = APIRouter(prefix="/feedback", tags=["feedback"])


@router.post("", response_model=FeedbackOut)
@limiter.limit("12/minute")
def create_feedback(request: Request, payload: FeedbackCreate, db: Session = Depends(get_db)):
    customer = None
    if payload.phone:
        digits = "".join(ch for ch in payload.phone if ch.isdigit() or ch == "+")
        customer = db.query(Customer).filter(Customer.phone == digits).first()
    row = Feedback(
        customer_id=customer.id if customer else None,
        guest_name=(customer.name if customer else payload.guest_name.strip()) or "Guest",
        rating=payload.rating,
        comment=payload.comment.strip(),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("/summary", response_model=RatingSummary)
def summary(db: Session = Depends(get_db)):
    count = db.query(func.count(Feedback.id)).scalar() or 0
    avg = db.query(func.avg(Feedback.rating)).scalar() or 0
    return RatingSummary(average=round(float(avg), 2) if count else 0, count=int(count))
