from datetime import date, datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Admin(Base):
    __tablename__ = "admins"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(32), unique=True, index=True)
    email: Mapped[str | None] = mapped_column(String(255), unique=True, index=True, nullable=True)
    date_of_birth: Mapped[date] = mapped_column(Date)
    newsletter_opt_in: Mapped[bool] = mapped_column(Boolean, default=True)
    has_spun: Mapped[bool] = mapped_column(Boolean, default=False)
    birthday_sms_year: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    feedback = relationship("Feedback", back_populates="customer")
    spin_results = relationship("SpinResult", back_populates="customer")
    coupons = relationship("Coupon", back_populates="customer")
    loyalty_card = relationship("LoyaltyCard", back_populates="customer", uselist=False)

    @property
    def loyalty_stamps(self) -> int:
        return self.loyalty_card.stamps if self.loyalty_card else 0

    @property
    def loyalty_goal(self) -> int:
        return self.loyalty_card.goal if self.loyalty_card else 8

    @property
    def birthday_email_year(self) -> int | None:
        return self.birthday_sms_year

    @birthday_email_year.setter
    def birthday_email_year(self, value: int | None):
        self.birthday_sms_year = value


class LoyaltyCard(Base):
    __tablename__ = "loyalty_cards"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"), unique=True, index=True)
    stamps: Mapped[int] = mapped_column(Integer, default=0)
    goal: Mapped[int] = mapped_column(Integer, default=8)
    reward: Mapped[str] = mapped_column(String(160), default="A free coffee or pastry")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    customer = relationship("Customer", back_populates="loyalty_card")


class Feedback(Base):
    __tablename__ = "feedback"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("customers.id"), nullable=True)
    guest_name: Mapped[str] = mapped_column(String(120), default="Guest")
    rating: Mapped[int] = mapped_column(Integer)
    comment: Mapped[str] = mapped_column(Text, default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="feedback")


class MenuItem(Base):
    __tablename__ = "menu_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    category: Mapped[str] = mapped_column(String(40), index=True)  # beverages | food | art
    price: Mapped[float] = mapped_column(Float)
    image_url: Mapped[str] = mapped_column(String(500), default="")
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)


class GalleryImage(Base):
    __tablename__ = "gallery_images"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(160), default="")
    image_url: Mapped[str] = mapped_column(String(500))
    caption: Mapped[str] = mapped_column(String(255), default="")
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)


class Offer(Base):
    __tablename__ = "offers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(160))
    description: Mapped[str] = mapped_column(Text, default="")
    discount: Mapped[str] = mapped_column(String(80))
    status: Mapped[str] = mapped_column(String(32), default="draft")  # draft | scheduled | sent
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    sms_sent: Mapped[int] = mapped_column(Integer, default=0)
    sms_failed: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    @property
    def emails_sent(self) -> int:
        return self.sms_sent

    @emails_sent.setter
    def emails_sent(self, value: int):
        self.sms_sent = value

    @property
    def emails_failed(self) -> int:
        return self.sms_failed

    @emails_failed.setter
    def emails_failed(self, value: int):
        self.sms_failed = value


class SpinResult(Base):
    __tablename__ = "spin_results"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"))
    prize_label: Mapped[str] = mapped_column(String(120))
    prize_code: Mapped[str] = mapped_column(String(40))
    is_win: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="spin_results")
    __table_args__ = (UniqueConstraint("customer_id", name="uq_spin_one_per_customer"),)


class Coupon(Base):
    __tablename__ = "coupons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    customer_id: Mapped[int] = mapped_column(Integer, ForeignKey("customers.id"))
    code: Mapped[str] = mapped_column(String(24), unique=True, index=True)
    label: Mapped[str] = mapped_column(String(160))
    discount: Mapped[str] = mapped_column(String(80))
    source: Mapped[str] = mapped_column(String(32))  # spin | birthday | offer
    is_redeemed: Mapped[bool] = mapped_column(Boolean, default=False)
    expires_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="coupons")


class ArtistOfMonth(Base):
    __tablename__ = "artists"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(160))
    medium: Mapped[str] = mapped_column(String(120), default="")
    bio: Mapped[str] = mapped_column(Text, default="")
    image_url: Mapped[str] = mapped_column(String(500), default="")
    month_label: Mapped[str] = mapped_column(String(40), default="")
    is_current: Mapped[bool] = mapped_column(Boolean, default=True)
