from datetime import date
import logging

from sqlalchemy.orm import Session

from models import Customer
from services.coupons import create_coupon
from services.email import send_email_html

logger = logging.getLogger("fourthplace.birthday")


def _birthday_email_html(customer_name: str, coupon_code: str) -> str:
    return f"""<html><body style="font-family:Arial,sans-serif;line-height:1.6;color:#1f1f1f;background:#fffaf4;padding:24px;">
    <div style="max-width:600px;margin:0 auto;">
      <h1 style="text-align:center;font-size:28px;letter-spacing:1px;margin-bottom:8px;">☕ FOURTH PLACE <em>ART CAFÉ</em></h1>
      <p style="text-align:center;font-size:14px;color:#4a4a4a;margin:0 0 20px;">Good Food · Good Art · Better Vibes 🖤</p>

      <h2 style="margin-bottom:12px;">Dear Valued Customer, 💌</h2>
      <h3 style="font-size:28px;margin:0 0 16px;">🎉 Happy 👑 Birthday! 🎂</h3>

      <p>Today is all about you —<br>
      your dreams, your journey,<br>
      and all the beautiful moments<br>
      you've created (and are yet to!) ✨</p>

      <p>As a little birthday treat from<br>
      our café to you... 💚</p>

      <p style="font-size:18px;font-weight:bold;">🎁 Enjoy a FREE Coffee ☕ + ArtKit 🎨 on us!</p>
      <p>Here's your coupon code: <strong>{coupon_code}</strong></p>

      <p>Here's to good food, great art,<br>
      and an even brighter year ahead! 🥂</p>

      <p>With love,<br>
      <strong>Fourth Place Art Café</strong> ♥️</p>
    </div>
    </body></html>"""


def send_birthday_email_to_customer(db: Session, customer_id: int) -> dict:
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if customer is None:
        raise ValueError("Customer not found")
    if not customer.email:
        raise ValueError("Customer email is missing")
    coupon = create_coupon(db, customer, label="Birthday free treat", discount="Free pastry or drip coffee", source="birthday", days_valid=7)
    text = (
        f"Dear Valued Customer,\n\n"
        f"🎉 Happy Birthday! 🎂\n\n"
        f"Today is all about you — your dreams, your journey, and all the beautiful moments you've created (and are yet to!).\n\n"
        f"As a little birthday treat from our café to you...\n\n"
        f"🎁 Enjoy a FREE Coffee + ArtKit on us!\n"
        f"Here's your coupon code: {coupon.code}\n\n"
        f"Here's to good food, great art, and an even brighter year ahead!\n\n"
        f"With love,\nFourth Place Art Café ♥️"
    )
    ok, detail = send_email_html(customer.email, "Happy birthday from Fourth Place", text, _birthday_email_html(customer.name, coupon.code))
    customer.birthday_email_year = date.today().year
    db.add(customer)
    db.commit()
    return {"ok": ok, "detail": detail, "coupon": coupon.code}


def send_birthday_perks(db: Session) -> int:
    today = date.today()
    customers = (
        db.query(Customer)
        .filter(
            Customer.date_of_birth.isnot(None),
        )
        .all()
    )
    sent = 0
    for customer in customers:
        dob = customer.date_of_birth
        if dob.month != today.month or dob.day != today.day:
            continue
        if customer.birthday_email_year == today.year:
            continue
        try:
            result = send_birthday_email_to_customer(db, customer.id)
            sent += 1
            if not result["ok"]:
                logger.info("Birthday coupon %s created; email skipped or failed", result["coupon"])
        except ValueError as exc:
            logger.info("Birthday email skipped for customer %s: %s", customer.id, exc)
    return sent
