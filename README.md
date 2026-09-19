# Fourth Place

Art-themed café — a gallery that happens to serve coffee. React (Vite) frontend, FastAPI backend, SQLite for the MVP.

## Quick start

Copy env files (never commit real Twilio or Maps keys):

```bash
copy backend\.env.example backend\.env
copy frontend\.env.example frontend\.env
```

On macOS/Linux use `cp` instead of `copy`.

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
python -m pip install -r requirements.txt
python ..\database\seed.py
uvicorn main:app --reload --port 8000
```

API docs: http://127.0.0.1:8000/docs  
Health: http://127.0.0.1:8000/health

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

Site: http://localhost:5173  
Vite proxies `/api` to the FastAPI server.

## Demo accounts (after seed)

| Role | How to sign in |
| --- | --- |
| Admin | `admin@fourthplace.cafe` / `fourthplace-admin` at `/admin/login` |
| Customer | Register, or demo phone `+919876543210` on the register page (sign in with phone) |

Change `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `backend/.env` before seeding if you want different credentials.

## What is included

**Public site:** cinematic home, digital menu with QR, about timeline, maps, guestbook (public average only), registration, spin-the-wheel (one spin per customer, server-enforced), coupon wallet, artist of the month, night mode, brush-stroke loading screen.

**Admin studio:** JWT login, guest search, private feedback, offer compose + Twilio launch/schedule, analytics charts, menu CRUD, gallery URL add/delete.

**Jobs:** every 15 minutes the API sends due scheduled offers and birthday coupons (SMS if Twilio env vars are set). Without Twilio credentials, SMS calls are logged and skipped rather than crashing the batch.

## Environment

See `backend/.env.example` and `frontend/.env.example` for:

- `DATABASE_URL` — SQLite path (`sqlite:///./database/fourth_place.db` relative to `backend/`)
- `JWT_SECRET`
- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- `GOOGLE_MAPS_API_KEY`, `CAFE_MAP_QUERY`
- `VITE_INSTAGRAM_URL`

## Layout

```
/frontend   React + Vite + Tailwind + Framer Motion + GSAP
/backend    FastAPI routers, JWT auth, Twilio helper
/database   seed.py (schema is created on API startup)
```

Moving to PostgreSQL later: change `DATABASE_URL`; models avoid SQLite-only types. Notes in `database/README.md`.
