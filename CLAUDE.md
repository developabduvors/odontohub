# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

OdontoHub is a dental clinic management platform (stomatologiya klinikasi) connecting patients and dentists. It is a monorepo with two independent apps:

- `backend/` — FastAPI + SQLAlchemy (sync), JWT auth, PostgreSQL (Neon)
- `frontend/` — React 19 + TypeScript + Vite, Redux Toolkit, React Query, Tailwind v4, i18next (Uz/Ru/En)

Comments, log messages, and some user-facing status strings mix English, Russian, and Uzbek (e.g. patient status values `"НОВЫЙ" / "ЛЕЧИТСЯ" / "ЗАПИСАН"`). Preserve the existing language when editing — do not translate.

## Common commands

### Backend (run from `backend/`)

```powershell
pip install -r requirements.txt
python run.py                                # canonical entrypoint, port 8000, no reload
# or, for hot-reload during development:
uvicorn app.main:app --reload --port 8000
```

There is **no pytest suite**. The many `test_*.py`, `debug_*.py`, `fix_*.py`, `check_*.py`, `add_*.py` files at `backend/` root are one-off scripts (DB inspection, password resets, ad-hoc API smoke tests) — run them directly with `python <script>.py`. Do not assume they form a regression suite.

### Frontend (run from `frontend/`)

```powershell
npm install
npm run dev          # Vite dev server on http://localhost:5173
npm run build        # production build into dist/ (used by Netlify)
npm run lint         # ESLint flat config (eslint.config.js)
npm run preview      # preview production build
```

There is **no test runner configured** in `frontend/package.json`.

## Architecture

### Backend layout (`backend/app/`)

```
core/        config.py (pydantic-settings), database.py, security.py, async_database.py
db/          session.py, deps.py, base.py            ← see "Two get_db" gotcha below
models/      SQLAlchemy ORM (User, PatientProfile, DentistProfile, Service,
             Appointment, Prescription, Allergy, Payment, PatientPhoto,
             Message, Review, Notification, Schedule, TimeSlot, Complaint,
             MedicalRecord)
schemas/     Pydantic request/response schemas (mirrors models/)
routers/     One router per domain — see "Router prefixes" below
services/    availability.py, chat_manager.py (WebSocket), notification_service.py,
             slot_generator.py
main.py      FastAPI app, CORS, startup-time schema migration, utility endpoints
```

### Router prefixes (set in `main.py`, NOT in router files)

| Router         | Prefix    | Notes                                     |
|----------------|-----------|-------------------------------------------|
| auth           | `/auth`   |                                           |
| patients       | (none)    | Routes start with `/patients/...`         |
| dentists       | (none)    | `/dentists/` is the only public endpoint  |
| services       | (none)    |                                           |
| appointments   | (none)    |                                           |
| chat           | `/api`    | Includes WebSocket                        |
| prescriptions  | `/api`    |                                           |
| allergies      | `/api`    |                                           |
| payments       | `/api`    |                                           |
| photos         | `/api`    |                                           |
| notifications  | (none)    |                                           |
| reviews        | (none)    |                                           |
| complaints     | (none)    |                                           |

When adding a new router, register it in `app/main.py` `include_router(...)` and decide the prefix there — the convention is inconsistent, so match the closest peer (e.g. CRUD on a sub-resource → `/api`; top-level domain → no prefix).

### Schema migration is inline, NOT Alembic

Despite `alembic` being in `requirements.txt`, there is no `alembic/` directory and no migrations folder. Instead:

1. `main.py` `on_startup()` runs every boot: creates Postgres enum types idempotently (`DO $$ ... EXCEPTION WHEN duplicate_object`), then `ALTER TABLE ... ADD COLUMN` for any missing columns it knows about, then `Base.metadata.create_all(checkfirst=True)`.
2. There are also GET endpoints that mutate schema on demand: `/init-db`, `/migrate-dentist-fields`. These are intentional utility endpoints, not leftover debug code.

When adding a new column to a model, you must **also add an `ALTER TABLE` block to `main.py` `on_startup()`** so existing deployments pick it up — `create_all(checkfirst=True)` does not add columns to pre-existing tables.

### Two `get_db` helpers exist

- `app/core/database.py::get_db` — used by `main.py` utility endpoints and `app/core/security.py`
- `app/db/deps.py::get_db` — used by some routers

Both yield from the same `SessionLocal`. There is no canonical one; match what nearby code in the same router uses. Don't refactor this without a clear reason.

### Auth flow

- `POST /auth/login` returns `{access_token, token_type, user_data}`
- Token stored client-side in `localStorage['access_token']`
- `frontend/src/api/api.ts` axios interceptor injects `Authorization: Bearer <token>` on every request **except** `/dentists/` and `/dentists` (the public dentist directory)
- 401 response → interceptor clears localStorage and redirects to `/login` (skipped on `/login`, `/register`, `/`)
- Backend: `app/core/security.py::get_current_user` decodes JWT; `require_role(UserRole.X)` enforces role
- `userrole` enum: `patient | dentist`; `verificationstatus`: `pending | approved | rejected`; `appointment_status`: `pending | confirmed | moved | cancelled | completed`

### Database connection

`app/db/session.py` reads `DATABASE_URL` and **silently falls back to `sqlite:///./app.db`** if unset. The committed `backend/sql_app.db` is from this fallback. When debugging "wrong data" issues, run `GET /debug-db` — it returns the masked engine URL and table list so you can confirm which DB is actually attached.

### CORS

Origins are a hardcoded list in `app/main.py` (localhost 5173/5174/5175/3000 + several Netlify domains). When deploying to a new frontend host, add it to **both** the `CORSMiddleware` allow_origins list **and** the `ALLOWED_ORIGINS` constant below it (the latter is used by the global exception handler to attach CORS headers to 500 responses so the browser can read the error).

### Frontend layout (`frontend/src/`)

```
api/         One axios module per backend domain (auth, appointments, chat, ...).
             api.ts is the configured axios instance — import it, don't create new ones.
Pages/       Route-level components (PatientHome, DoctorProfile, Booking, ...)
components/  Shared UI grouped by feature folder (Appointments/, Chat/, Doctors/, ...)
             Some folders use Uzbek names (e.g. "Bosh sahifa" = home).
store/       Redux Toolkit store (store.ts)
Routes/      index.tsx (router config) and path.ts (URL constants — use these,
             don't hardcode paths)
i18n.js      i18next setup; translations in translations/
types/       Shared TS types (patient.ts has the canonical Doctor / Appointment /
             Chat / Service interfaces)
```

State strategy: Redux Toolkit for client/global state, **React Query** for server state (caching, refetching). Don't put server data in Redux. Forms use **React Hook Form**.

### Vite dev proxy

`frontend/vite.config.ts` proxies `/auth`, `/patients`, `/dentists`, `/services`, `/appointments`, `/api` to `VITE_API_URL` (default `http://localhost:8000`). When adding a new top-level backend route prefix, add it to the proxy block too, otherwise dev requests will hit the Vite server and 404.

### Frontend env

- `VITE_API_URL` — backend base URL (axios `baseURL` and Vite proxy target)
- `VITE_USE_API` — feature flag toggle, see usages before changing
- `VITE_BASE_URL` — passed through `define` in `vite.config.ts`

### Deployment

- **Frontend:** Netlify, configured in `frontend/netlify.toml` (`base = "frontend"`, `command = "npm run build"`, SPA redirect `/* → /index.html`)
- **Backend:** runs as `python run.py` (uvicorn, host `127.0.0.1`, port 8000, no reload). No Dockerfile or deployment manifest is committed.
