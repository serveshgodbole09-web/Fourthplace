from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite:///./database/fourth_place.db"
    jwt_secret: str = "dev-only-change-me"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 60 * 24 * 7
    frontend_origin: str = "http://localhost:5173"
    smtp_host: str | None = None
    smtp_port: str | None = None
    smtp_user: str | None = None
    smtp_password: str | None = None
    email_from: str = ""
    resend_api_key: str = ""

    google_maps_api_key: str = ""
    cafe_map_query: str = "Cafe Fourth Place, Shaniwar Peth, Rajmachi, Guruwar Peth, Satara, Maharashtra 415001"
    cafe_lat: float = 17.6785133
    cafe_lng: float = 73.9937337

    admin_email: str = "admin@fourthplace.cafe"
    admin_password: str = "fourthplace-admin"


@lru_cache
def get_settings() -> Settings:
    return Settings()
