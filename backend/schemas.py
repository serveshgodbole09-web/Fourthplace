from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field, field_validator


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    customer: dict | None = None
    admin: dict | None = None


class AdminLogin(BaseModel):
    email: str
    password: str


class CustomerRegister(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str = Field(min_length=8, max_length=20)
    email: EmailStr
    date_of_birth: date
    newsletter_opt_in: bool = True

    @field_validator("phone")
    @classmethod
    def normalize_phone(cls, v: str) -> str:
        digits = "".join(ch for ch in v if ch.isdigit() or ch == "+")
        if len(digits.replace("+", "")) < 8:
            raise ValueError("Enter a valid phone number")
        return digits


class CustomerLogin(BaseModel):
    phone: str


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: str
    email: str | None = None
    date_of_birth: date
    newsletter_opt_in: bool
    has_spun: bool
    created_at: datetime
    loyalty_stamps: int = 0
    loyalty_goal: int = 8

    class Config:
        from_attributes = True


class FeedbackCreate(BaseModel):
    guest_name: str = Field(default="Guest", max_length=120)
    phone: str | None = None
    rating: int = Field(ge=1, le=5)
    comment: str = Field(default="", max_length=2000)


class FeedbackOut(BaseModel):
    id: int
    guest_name: str
    rating: int
    comment: str
    created_at: datetime
    customer_id: int | None

    class Config:
        from_attributes = True


class RatingSummary(BaseModel):
    average: float
    count: int


class MenuItemIn(BaseModel):
    name: str
    description: str = ""
    category: str
    price: float
    image_url: str = ""
    is_available: bool = True
    sort_order: int = 0


class MenuItemOut(MenuItemIn):
    id: int

    class Config:
        from_attributes = True


class GalleryIn(BaseModel):
    title: str = ""
    image_url: str
    caption: str = ""
    sort_order: int = 0


class GalleryOut(GalleryIn):
    id: int

    class Config:
        from_attributes = True


class OfferIn(BaseModel):
    title: str
    description: str = ""
    discount: str
    scheduled_at: datetime | None = None
    send_now: bool = False


class OfferOut(BaseModel):
    id: int
    title: str
    description: str
    discount: str
    status: str
    scheduled_at: datetime | None
    sent_at: datetime | None
    sms_sent: int = 0
    sms_failed: int = 0
    emails_sent: int = 0
    emails_failed: int = 0
    created_at: datetime

    class Config:
        from_attributes = True


class SpinResponse(BaseModel):
    prize_label: str
    prize_code: str
    is_win: bool
    coupon: dict | None = None
    already_spun: bool = False


class CouponOut(BaseModel):
    id: int
    code: str
    label: str
    discount: str
    source: str
    is_redeemed: bool
    expires_at: datetime | None
    created_at: datetime

    class Config:
        from_attributes = True


class LoyaltyCardOut(BaseModel):
    id: int
    stamps: int
    goal: int
    reward: str

    class Config:
        from_attributes = True


class LoyaltyStampOut(LoyaltyCardOut):
    message: str


class ArtistOut(BaseModel):
    id: int
    name: str
    medium: str
    bio: str
    image_url: str
    month_label: str
    is_current: bool

    class Config:
        from_attributes = True


class PublicConfig(BaseModel):
    google_maps_api_key: str
    cafe_map_query: str
    cafe_lat: float
    cafe_lng: float


class AnalyticsOut(BaseModel):
    total_customers: int
    average_rating: float
    feedback_count: int
    spin_wins: int
    spin_total: int
    prize_breakdown: dict
    feedback_trend: list
