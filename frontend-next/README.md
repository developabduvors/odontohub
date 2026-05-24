# OdontoHub — Next.js Frontend (Phase 1)

OdontoHub frontendning **Next.js 16 (App Router)** versiyasi. Joriy `frontend/` (Vite) versiya bilan **parallel** ishlaydi.

## Stack

- **Next.js 16.2** (App Router, Turbopack), React 19, TypeScript 5
- **Tailwind CSS v4** (`@tailwindcss/postcss`)
- **Redux Toolkit** + **react-redux** (client state)
- **TanStack Query v5** (server state)
- **next-intl v4** — i18n with URL prefix (`/uz`, `/ru`, `/en`, `/kz`)
- **axios** — JWT `Authorization: Bearer <token>` interceptor
- **react-hook-form** — forms
- **lucide-react**, **@heroicons/react**, **react-icons** — icons

## Phase 1 — tugallangan

- ✅ Skafold, providerlar, i18n middleware
- ✅ `localStorage`-based auth interceptor (joriy backend bilan mos)
- ✅ Role guard layoutlar (token + role tekshiruvi)
- ✅ Sahifalar:
  - `/[locale]` — Welcome (til tanlash + role'ga o'tish)
  - `/[locale]/login` — POST `/auth/login` + redirect by role
  - `/[locale]/register_pat` — POST `/auth/register` (patient)
  - `/[locale]/role` — manual role selection
  - `/[locale]/menu` — doctor stub
  - `/[locale]/home` — patient stub

## Phase 2+ — to'liq UI

Hali ko'chirilmagan: Doctor (patients, profile, appointments, analytics, chats, notifications, settings) va Patient (calendar, history, profile, doctors, specialties, booking, ...) sahifalari. WebSocket chat, leaflet maps, video call ham keyingi bosqichda.

## Ishga tushirish

Backend ishlab turishi kerak (port 8000):

```powershell
cd backend
python run.py
```

Frontend:

```powershell
cd frontend-next
npm install
npm run dev
```

`http://localhost:3000` ochiladi → avtomatik `/ru` ga redirect bo'ladi (default locale). Browser tilga qarab `/uz`, `/en`, `/kz` ham bo'lishi mumkin.

## Tillarni almashtirish

URL prefiksini o'zgartiring: `/uz/menu`, `/ru/menu`, `/en/menu`, `/kz/menu`. Welcome sahifadagi til tanlash UI'sidan ham foydalanishingiz mumkin.

## Auth oqimi

1. Login (`/login`): `POST /auth/login` → token + user_data localStorage'da, Redux'ga setUser
2. Role-based redirect: dentist → `/menu`, patient → `/home`
3. RoleGuard layoutlari token + role tekshiradi (client-side `useEffect`)
4. 401 javob → localStorage tozalanadi, `/login`'ga redirect

## Build

```powershell
npm run build
npm run start
```

Phase 1'da `npm run build` 24 ta static sahifa generatsiya qiladi (6 route × 4 locale).

## Eski Vite frontend bilan farqi

- **URL'lar bir xil**, faqat oldida locale prefiksi qo'shildi (`/menu` → `/uz/menu`)
- Backend, JWT, axios interceptor — bir xil
- `localhost:5173` (Vite) va `localhost:3000` (Next.js) bir vaqtda ishlatilishi mumkin
- Backend `CORSMiddleware` `localhost:3000`'ni allow qiladi (joriy holat)

## Phase 1 sahifalari ko'chirish jadvali (Phase 2+)

| Doctor | Patient |
|---|---|
| /patients | /calendar |
| /patients/:id | /appointment/:id |
| /profile, /profile/edit | /history |
| /settings | /profile_pat |
| /appointments | /patient/chats |
| /analytics, /analytics/finance | /doctors, /specialties |
| /chats, /chats/:id | /booking, /booking/checkup-preview |
| /notifications | /my-dentist |
|  | /doctor-services, /doctor-cases |
|  | /video-call |
|  | /treatments |
|  | /search |

Spec/Plan: `docs/superpowers/specs/2026-05-14-frontend-next-migration-design.md` va `docs/superpowers/plans/2026-05-14-frontend-next-phase-1.md`.
