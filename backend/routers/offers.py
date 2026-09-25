from datetime import datetime
import traceback

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from auth import get_current_admin
from database import get_db
from models import Offer
from schemas import OfferIn, OfferOut
from services.offers import launch_offer

router = APIRouter(prefix="/offers", tags=["offers"])


@router.get("", response_model=list[OfferOut])
def list_offers(db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    return db.query(Offer).order_by(Offer.created_at.desc()).all()


@router.post("", response_model=OfferOut)
def create_offer(payload: OfferIn, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    print(f"[DEBUG routes/offers] create_offer route entry: title={payload.title!r}, send_now={payload.send_now}, scheduled_at={payload.scheduled_at!r}", flush=True)
    try:
        offer = Offer(
            title=payload.title.strip(),
            description=payload.description.strip(),
            discount=payload.discount.strip(),
            scheduled_at=payload.scheduled_at,
            status="scheduled" if payload.scheduled_at and not payload.send_now else "draft",
        )
        db.add(offer)
        db.commit()
        db.refresh(offer)
        if payload.send_now:
            print("[DEBUG routes/offers] calling launch_offer() from create_offer", flush=True)
            offer = launch_offer(db, offer)
            print("[DEBUG routes/offers] returned from launch_offer() in create_offer", flush=True)
        return offer
    except Exception:
        print("[DEBUG routes/offers] create_offer EXCEPTION")
        traceback.print_exc()
        raise


@router.post("/{offer_id}/launch", response_model=OfferOut)
def launch(offer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    print(f"[DEBUG routes/offers] launch route entry: offer_id={offer_id}", flush=True)
    try:
        offer = db.query(Offer).filter(Offer.id == offer_id).first()
        if not offer:
            raise HTTPException(status_code=404, detail="Offer not found")
        if offer.status == "sent":
            raise HTTPException(status_code=400, detail="Offer already sent")
        print(f"[DEBUG routes/offers] before launch_offer: offer_id={offer_id}, status={offer.status}", flush=True)
        result = launch_offer(db, offer)
        print(f"[DEBUG routes/offers] after launch_offer: offer_id={offer_id}, status={result.status}, sent={result.emails_sent}, failed={result.emails_failed}", flush=True)
        return result
    except Exception:
        print(f"[DEBUG routes/offers] launch EXCEPTION for offer_id={offer_id}")
        traceback.print_exc()
        raise


@router.delete("/{offer_id}")
def delete_offer(offer_id: int, db: Session = Depends(get_db), _admin=Depends(get_current_admin)):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")
    db.delete(offer)
    db.commit()
    return {"ok": True, "message": "Offer deleted."}


def process_due_offers(db: Session) -> int:
    now = datetime.utcnow()
    due = (
        db.query(Offer)
        .filter(Offer.status == "scheduled", Offer.scheduled_at.isnot(None), Offer.scheduled_at <= now)
        .all()
    )
    for offer in due:
        launch_offer(db, offer)
    return len(due)
