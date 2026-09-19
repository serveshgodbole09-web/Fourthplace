"""Lightweight 'migrations' note for the SQLite MVP.

SQLAlchemy `Base.metadata.create_all` is used on startup.
When moving to PostgreSQL:

1. Change DATABASE_URL to a postgres DSN.
2. Optionally introduce Alembic (`alembic init`) and autogenerate.
3. No SQLite-specific types are used in models.py — the schema should port as-is.
"""
