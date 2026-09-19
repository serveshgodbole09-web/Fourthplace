from pathlib import Path

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import declarative_base, sessionmaker

from config import BACKEND_DIR, get_settings

settings = get_settings()

db_dir = BACKEND_DIR / "database"
db_dir.mkdir(parents=True, exist_ok=True)

connect_args = {}
if settings.database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

engine = create_engine(settings.database_url, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def ensure_schema():
    if not settings.database_url.startswith("sqlite"):
        return
    with engine.begin() as connection:
        tables = inspect(engine).get_table_names()
        if "customers" in tables:
            columns = {column["name"] for column in inspect(engine).get_columns("customers")}
            if "email" not in columns:
                connection.execute(text("ALTER TABLE customers ADD COLUMN email VARCHAR(255)"))


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
