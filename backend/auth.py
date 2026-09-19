from datetime import datetime, timedelta

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from config import get_settings
from database import get_db
from models import Admin, Customer

bearer = HTTPBearer(auto_error=False)
settings = get_settings()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except (ValueError, TypeError):
        return False


def create_token(subject: str, role: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": subject, "role": role, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token") from exc


def _credentials(creds: HTTPAuthorizationCredentials | None) -> dict:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    return decode_token(creds.credentials)


def get_current_admin(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Admin:
    payload = _credentials(creds)
    if payload.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    admin = db.query(Admin).filter(Admin.email == payload.get("sub")).first()
    if not admin:
        raise HTTPException(status_code=401, detail="Admin not found")
    return admin


def get_current_customer(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Customer:
    payload = _credentials(creds)
    if payload.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")
    customer = db.query(Customer).filter(Customer.phone == payload.get("sub")).first()
    if not customer:
        raise HTTPException(status_code=401, detail="Customer not found")
    return customer


def get_optional_customer(
    creds: HTTPAuthorizationCredentials | None = Depends(bearer),
    db: Session = Depends(get_db),
) -> Customer | None:
    if creds is None:
        return None
    try:
        payload = decode_token(creds.credentials)
    except HTTPException:
        return None
    if payload.get("role") != "customer":
        return None
    return db.query(Customer).filter(Customer.phone == payload.get("sub")).first()
