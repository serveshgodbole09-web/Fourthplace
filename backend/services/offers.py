from datetime import datetime

from sqlalchemy.orm import Session

from models import Customer, Offer
from services.email import send_email_batch


def _offer_email_html(offer_title: str, offer_description: str, offer_discount: str) -> str:
    return f"""<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;background:#fffaf4;padding:24px;">
    <div style="max-width:600px;margin:0 auto;">
      <h1 style="text-align:center;font-size:28px;letter-spacing:1px;margin-bottom:8px;">☕ FOURTH PLACE <em>ART CAFÉ</em></h1>
      <p style="text-align:center;font-size:14px;color:#4a4a4a;margin:0 0 20px;">Good Food · Good Art · Better Vibes 🖤</p>
      <h2 style="margin-bottom:10px;">{offer_title}</h2>
      <p style="font-size:18px; margin:0 0 12px;">{offer_description}</p>
      <p style="font-size:20px; font-weight:bold; color:#2a5b4c; margin:0 0 12px;">{offer_discount}</p>
      <p>Show this email in the café and enjoy your treat with us.</p>
      <p>With love,<br><strong>Fourth Place Art Café</strong> ♥️</p>
    </div>
    </body></html>"""


def launch_offer(db: Session, offer: Offer) -> Offer:
    customers = db.query(Customer).all()
    recipients = [c.email.strip() for c in customers if c.email and c.email.strip() and (c.newsletter_opt_in is True or c.newsletter_opt_in is None)]
    text_body = (
        f"Fourth Place — {offer.title}: {offer.description} "
        f"({offer.discount}). Show this email in the café."
    )
    html_body = _offer_email_html(offer.title, offer.description, offer.discount)
    sent, failed = send_email_batch(recipients, f"Fourth Place offer: {offer.title}", text_body, html_body) if recipients else (0, 0)
    offer.emails_sent = sent
    offer.emails_failed = failed
    offer.status = "sent"
    offer.sent_at = datetime.utcnow()
    db.add(offer)
    db.commit()
    db.refresh(offer)
    return offer
