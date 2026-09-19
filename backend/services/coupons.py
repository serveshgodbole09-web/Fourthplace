import secrets
import string
from datetime import datetime, timedelta

from sqlalchemy.orm import Session

from models import Coupon, Customer


def generate_coupon_code(prefix: str = "FP") -> str:
    alphabet = string.ascii_uppercase + string.digits
    body = "".join(secrets.choice(alphabet) for _ in range(6))
    return f"{prefix}-{body}"


def create_coupon(
    db: Session,
    customer: Customer,
    label: str,
    discount: str,
    source: str,
    days_valid: int = 30,
) -> Coupon:
    coupon = Coupon(
        customer_id=customer.id,
        code=generate_coupon_code("FP" if source != "birthday" else "BDAY"),
        label=label,
        discount=discount,
        source=source,
        expires_at=datetime.utcnow() + timedelta(days=days_valid),
    )
    db.add(coupon)
    db.commit()
    db.refresh(coupon)
    return coupon
