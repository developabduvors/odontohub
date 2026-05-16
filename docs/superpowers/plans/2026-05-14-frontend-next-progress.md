# Frontend → Next.js Migration — Progress Log

**Sana:** 2026-05-14
**Branch:** `patient/abduvoris`
**Holat:** Phase 1 + 2a/2b/2c + **Phase 2d yakunlandi (2026-05-16)**. Doctor flow Vite versiyasiga ~100% teng — qolgani faqat `/chats` WebSocket (spec yozilgan, implementatsiya kutmoqda).

---

## Phase 2 Doctor (2026-05-14) — to'liq yakunlandi

Bir kunda Phase 2'ning hamma 10 ta task'i bajarildi. Doctor flow Vite versiyasiga teng (modulo Phase 2c uchun qoldirilgan AppointmentDetailModal + InProgressView + PrivacySettings).

**Phase 2b/c — yangi commit'lar (Task 6-10):**
```
f7a074a0 feat(frontend-next): port /profile/edit page (538-line form with leaflet map picker)
b4ec79b8 feat(frontend-next): port /profile page (DoctorProfile with 8 sub-sections)
051f8e2f feat(frontend-next): port /appointments page with list view, calendar, and record modal
094c8a6d feat(frontend-next): port /settings page with 5 tabs (notification/privacy/language/data/support)
663d4cf6 feat(frontend-next): port /patients page with search, filter, and add modal
```

**Bajarilgan sahifalar:** /menu, /patients, /profile, /profile/edit, /appointments, /settings.

**Yangi infra:** ServiceModal, AddPatientModal, AppointmentModal, RescheduleModal, CalendarView, MapModal (next/dynamic ssr:false), 5 ta Settings sub-tab, 8 ta DoctorProfile sub-section.

**Build:** 47 ta static sahifa.

**Phase 2c'ga qoldi:**
- `AppointmentDetailModal` + `InProgressView` (Appointments detail flow)
- `PrivacySettings` to'liq forma (password change + backup phone, 500 satr)
- `PatientDetailPage` (`/patients/[id]` — 8+ sub-komponent: Medcard, Allergy, Prescription, Payments, Notes, Photos, Appointments)
- Tezroq.tsx'dagi 3 modal'ni real modalga ulash (AddNoteModal hali port qilinmagan)

**Lucide-react incompat:** `^1.14.0` Instagram/Facebook ko'rsatkichlarini olib tashlagan. Hozir `react-icons/fa`'ga moslashtirildi. Kelajakda butun loyihaga `npm i lucide-react@latest` qilish mumkin.

---

## Register role selection (Пациент/Врач) port (2026-05-16) — yakunlandi

Vite `Register1.tsx`'da register sahifasida Врач/Пациент tanlovi bor edi;
Next port (`register_pat`) faqat patientga hardcode qilingan, tanlov yo'q edi
(user screenshot bilan ko'rsatdi). Spec + plan yozildi (commit `39d2498c`,
`e01a018e`), keyin implementatsiya:

- **NEW `components/Auth/RegisterView.tsx`** (`'use client'`) — Vite Register1
  sodiq port. `role: 'patient'|'dentist'` **prop** (local state emas). Селектор
  tugmalari route'lar orasida navigatsiya qiladi: Врач → `paths.registrDoc`,
  Пациент → `paths.registerPat` (URL har doim rolни aks ettiradi). Submit →
  `POST /auth/register {role}` → `/auth/me` (fallback user) → dispatch(setUser).
  Redirect: dentist → `/menu`, patient → `is_first_time` + `/home`. Hardcoded
  RU matnlar (login/register_pat kabi, next-intl kalitsiz). Commit `cb0e7f73`.
- **`(public)/register_pat/page.tsx`** to'liq almashtirildi (eski patient-only
  forma + `Field` helper o'chdi, 199 deletion) → `<RegisterView role="patient"/>`.
  **NEW `(public)/register_doc/page.tsx`** → `<RegisterView role="dentist"/>`.
  Ikkalasi ham server component wrapper (`'use client'` faqat RegisterView'da).
  Commit `793bde13`.
- Login register link allaqachon `paths.registerPat`'ga ketardi — o'zgartirilmadi.
  Backend `/auth/register` `role:'dentist'`ni allaqachon qabul qiladi.

Verifikatsiya: `npx tsc --noEmit` (exit 0) ×2 + `npm run build` (✓, 0 warning).
Static sahifalar **63 → 67** (`/register_doc` ×4 locale qo'shildi),
`/register_pat` va `/register_doc` ikkalasi SSG ●. **Qoldi:** manual smoke
(backend + dev) — user vizual tekshiradi: selektor, route toggle, redirectlar.
Push qilinmadi (oldingi fazalar kabi local). Spec:
`docs/superpowers/specs/2026-05-16-frontend-next-register-role-selection-design.md`,
Plan: `docs/superpowers/plans/2026-05-16-frontend-next-register-role-selection.md`.

---

## Chats WebSocket + Analytics/Chat layout fix (2026-05-16) — yakunlandi

`docs/superpowers/plans/2026-05-16-frontend-next-chats-websocket.md` rejasining
Task 1-4'i implementatsiya qilindi (commit'lar `ef38f7e1..104dc7b1`): `api/chat.ts`,
`components/Chat/MessageBubble.tsx`, `components/Chat/ChatsView.tsx`,
`/chats` + `/chats/[id]` route'lari. Build 63 static (chats + chats/[id] qo'shildi).

Keyin user 2 ta layout bug'ni topdi (Analytics + Chat) — `togrla` so'rovi:

- **`/analytics/finance`** DoctorPageShell'siz edi (bare `flex-1 min-h-screen`
  div), shuning uchun `/analytics` (Analitic, DoctorPageShell ishlatadi) kabi
  `<main pt-20 lg:pt-0>` ichiga to'g'ri joylashmas edi. Yechim: kontentni
  `DoctorPageShell`ga o'radik (parity), finance/monitoring toggle header +
  `AnalyticsFilter` saqlandi. Stray bo'sh qator (`'use client'` oldidan) ham
  olib tashlandi. Commit `31fef367`.
- **`ChatsView`** root balandligi `h-[calc(100dvh-56px)]`/`md:100vh-88px` edi,
  lekin MainLayout `<main>` `lg`'gacha `pt-20` (80px) va `md:m-4` (32px)
  qo'shadi — mobil/md'da xabar inputi ~24px ekrandan tushib ketardi. Yechim:
  `100dvh-80px` / `md 100vh-112px`; `lg 100vh-32px` o'zgarmadi. Commit `7a7dea7a`.

Verifikatsiya: `npx tsc --noEmit` (exit 0) + `npm run build` (✓, 63 static,
0 warning). `/analytics/finance` hali SSG ●, `/chats` ●, `/chats/[id]` ƒ.
Push qilinmadi (oldingi fazalar kabi local).

---

## Phase 2d Doctor finish (2026-05-16) — yakunlandi

Reja: `docs/superpowers/plans/2026-05-15-frontend-next-phase-2d-doctor-finish.md`. 8 ta task'dan 7 tasi bajarildi (8-chi = chats spec, implementatsiya alohida session).

**Yangi commit'lar (Phase 2d):**
```
feat(frontend-next): wire Tezroq quick-actions + port AddNoteModal
feat(frontend-next): port AppointmentDetailModal + wire detail flow
feat(frontend-next): port InProgressView + wire in_progress view
feat(frontend-next): port /notifications page
feat(frontend-next): port /analytics page
feat(frontend-next): port /analytics/finance page
docs(frontend-next): chats WebSocket port implementation plan
```

**Bajarilgan:**
- `Tezroq.tsx`: 4 ta quick-action'dan 3 tasi real modal'ga ulandi (AppointmentModal, AddPatientModal, **AddNoteModal port qilindi**). Faqat "message" stub qoldi (chat Phase 2d-chats'ga bog'liq).
- `AppointmentDetailModal` (cancel/reschedule/notes/start) + `InProgressView` (visit_type, finish appointment/treatment + createPayment) port qilindi va `/appointments` page'ga ulandi (`view: 'list'|'calendar'|'in_progress'`, in_progress status InProgressView'ga yo'naltiriladi).
- Yangi sahifalar: `/notifications`, `/analytics`, `/analytics/finance`. Sidebar (`Doshboard.tsx`) allaqachon `paths.*`'ga link berardi — endi reachable.
- Yangi komponentlar: `AddNoteModal`, `AppointmentDetailModal`, `InProgressView`, `Analytics/AnalyticsFilter`, `Analytics/AnalyticsHeader`.

**Muhim qarorlar:**
- Video-call tugmasi (`AppointmentDetailModal`) `function_in_development` toast bilan stub — `/video-call` Phase 3 patient flow.
- `Analitic.tsx` chart kutubxonasi ishlatmaydi (sof CSS bar chart) — `next/dynamic ssr:false` kerak emas edi (reja shubhasi noto'g'ri chiqdi).
- `Finance.tsx` to'liq mock UI (statik data) — sodiq port qilindi, payments API'ga ulanmadi (Vite manbasi mock).
- Vite→Next pattern: `react-router-dom` → `@/i18n/navigation` (locale-aware), `react-i18next` → `next-intl`, nisbiy import → `@/` alias, `'use client'`, asset import → `/public` string path.

**Build:** 51 static + 1 dynamic (`/patients/[id]`). Chats qo'shilgach: 51 static + 2 dynamic kutilmoqda.

**Qoldi (Phase 2d-chats — alohida spec):**
- `docs/superpowers/plans/2026-05-16-frontend-next-chats-websocket.md` — to'liq, placeholder'siz 5-task reja. `api/chat.ts` + `MessageBubble` + shared `ChatsView` (WebSocket) + `/chats` & `/chats/[id]` route'lar.

---

## Phase 2a (2026-05-14, kech) — Foundation polish + /menu yakunlandi

5 ta yangi commit `patient/abduvoris`'da:

```
93bd940e feat(frontend-next): port /menu page (Hero + Analytics + NewPatients + PatientSearch + Tezroq + Section)
8f51e81c feat(frontend-next): port DoctorPageShell visual chrome
410bb5d7 feat(frontend-next): port Doshboard sidebar with mobile drawer + focus panel
14bce0e2 feat(frontend-next): port API hook modules (profile, appointments, notifications, services, auth) + auth utils
947f2461 feat(frontend-next): port Toast component + restore toast calls in Login/Register
```

**Yangi fayllar:**
- `components/Shared/Toast.tsx` + ToastContainer mount in `[locale]/layout.tsx`
- `utils/auth.ts` — SSR-safe getToken/getUser/isAuthenticated/getUserRole/isPatient/isDentist/logout
- `api/profile.ts`, `api/appointments.ts`, `api/notifications.ts`, `api/services.ts`, `api/auth.ts`, `api/reviews.ts`
- `layouts/Doshboard.tsx` (163 satr — mobile drawer + focus panel + 5-item nav + badge)
- `components/Layout/DoctorPageShell.tsx` (visual chrome)
- `components/Bosh sahifa/{Hero,Analytics,NewPatients,PatientSearch,Tezroq,Section}.tsx`

**Stubs (port qilinmagan):**
- `Tezroq.tsx`'dagi 3 modal: `AppointmentModal`, `AddPatientModal`, `AddNoteModal` — hozir `toast.info('function in development')` chiqaradi. Real modallarni Task 6 (/patients) va Task 9 (/appointments) ko'chirilganda port qilinadi.

**Build:** 27 static pages (Phase 1: 24 + new `/menu` real content + 4 locale = ko'paymagan, faqat menu real bo'ldi).

## Sinash uchun

```powershell
# Terminal 1
cd backend
python run.py

# Terminal 2
cd frontend-next
npm run dev
```

Browser: `http://localhost:3000` → `/ru` redirect → Welcome. Dentist bilan login → `/ru/menu` to'liq UI (Hero search/notifs/profile + Analytics stat cards + NewPatients carousel + Tezroq quick actions + Section daily appointments).

## Phase 2b uchun qoladi (`2026-05-14-frontend-next-phase-2-doctor.md` plan)

- Task 6: `/patients` (Patsant) — search + jadval + Add Patient modal — `Qidiruv`, `PatsentTable`, `AddPatientModal`
- Task 7: `/profile` (DoctorProfile) — 7 sub-section
- Task 8: `/profile/edit` (EditDoctorProfile, 538 satr) — bonus
- Task 9: `/appointments` (Appointments) — kalendar + reschedule — bonus
- Task 10: `/settings` (Settings) — bonus
- Task 11: Phase 2 yakuniy build + progress log update

**PatientDetailPage (`/patients/[id]`) Phase 2c'ga qoldirildi** — 8+ sub-komponent, alohida spec kerak.

---

## Bugun qilingan ish (15 ta commit)

Hammasi `patient/abduvoris` branch'iga commit qilingan, **push qilinmagan** (siz xohlasangiz `git push` qilamiz).

```
54c3c917 docs(frontend-next): replace boilerplate README with Phase 1 guide
78b1abe5 feat(frontend-next): Register Patient + Role + Menu + Home + group layouts
c276f0d2 feat(frontend-next): port Login page (POST /auth/login + role-based redirect)
4527ba46 feat(frontend-next): port Welcome page with locale switcher
96d2e78e feat(frontend-next): root + [locale] layouts wired with providers and globals.css
b3867690 refactor(frontend-next): adopt default create-next-app layout (no src/)
bb16ff38 chore(frontend-next): copy fonts and image assets to public/assets/
61414a5b feat(frontend-next): add minimal MainLayout (doctor) and PatientLayout
7d24d687 feat(frontend-next): add Redux store, axios client, providers, RoleGuard, paths
b793af00 feat(frontend-next): port TypeScript types and interfaces
a53ffb0c feat(frontend-next): port translations (uz/ru/en/kz) and adapt to ICU format
76802602 feat(frontend-next): wire next-intl routing, request handler, plugin, middleware
d2f6af89 chore(frontend-next): split path aliases (LATER REVERTED to default)
b7177631 feat(frontend-next): install Redux Toolkit, React Query, next-intl, axios, UI deps
7a75c107 feat(frontend-next): scaffold Next.js 16 project with App Router, TS, Tailwind v4
```

## Yakuniy struktura

```
frontend-next/
├── app/
│   ├── layout.tsx                  ← Server, minimal passthrough
│   ├── globals.css                 ← Tailwind + design system (Google Fonts, btn-primary, ...)
│   └── [locale]/
│       ├── layout.tsx              ← Server, NextIntlClientProvider + ReduxProvider + QueryProvider + AuthInit
│       ├── page.tsx                ← Welcome (full UI)
│       ├── (public)/
│       │   ├── login/page.tsx      ← Login (full UI, axios POST /auth/login + /auth/me)
│       │   └── register_pat/page.tsx ← Register patient (new simpler form, POST /auth/register)
│       ├── (auth)/
│       │   ├── layout.tsx          ← RoleGuard (token-only)
│       │   └── role/page.tsx       ← Manual role selection (full UI)
│       ├── (doctor)/
│       │   ├── layout.tsx          ← RoleGuard requiredRole="dentist" + MainLayout
│       │   └── menu/page.tsx       ← STUB only
│       └── (patient)/
│           ├── layout.tsx          ← RoleGuard requiredRole="patient" + PatientLayout
│           └── home/page.tsx       ← STUB only
├── api/api.ts                      ← axios + Authorization Bearer interceptor + 401 redirect
├── guards/RoleGuard.tsx            ← 'use client', useEffect with localStorage check
├── i18n/
│   ├── routing.ts                  ← locales: uz/ru/en/kz, default: ru, localePrefix: always
│   ├── navigation.ts               ← Link, useRouter, usePathname wrappers
│   └── request.ts                  ← getRequestConfig with messages from ../messages/
├── layouts/
│   ├── MainLayout.tsx              ← Doctor sidebar (minimal) + Logout
│   └── PatientLayout.tsx           ← Patient bottom nav (minimal) + Logout
├── lib/paths.ts                    ← URL constants
├── messages/                       ← next-intl convention (renamed from translations/)
│   ├── uz.json, ru.json, en.json, kz.json
├── providers/
│   ├── ReduxProvider.tsx
│   ├── QueryProvider.tsx
│   └── AuthInit.tsx
├── public/assets/                  ← fonts + img (ko'chirilgan)
├── store/
│   ├── store.ts, hooks.ts
│   └── slices/userSlice.ts
├── types/                          ← patient, allergy, notification, prescription, index
├── middleware.ts                   ← next-intl middleware
├── next.config.ts                  ← createNextIntlPlugin wrapper
└── tsconfig.json                   ← @/* → ./* (default)
```

## Sinash uchun (ertaga eslatma)

```powershell
# Terminal 1
cd backend
python run.py

# Terminal 2
cd frontend-next
npm run dev
```

`http://localhost:3000` → `/ru` redirect → Welcome.

Build:
```powershell
cd frontend-next
npm run build
```

Build vaqti ~9s, **24 ta static sahifa** (6 route × 4 locale) generatsiya bo'ladi.

## Muhim eslatmalar (ertaga e'tibor ber)

1. **Backend `localhost:3000` ni CORS allow'da** — qo'shimcha o'zgartirish kerak emas. `backend/app/main.py:28` da bor.

2. **Stubs:**
   - `app/[locale]/(doctor)/menu/page.tsx` — faqat placeholder matn
   - `app/[locale]/(patient)/home/page.tsx` — faqat placeholder matn
   - `layouts/MainLayout.tsx` va `PatientLayout.tsx` — minimal nav, joriy `frontend/src/Layouts/`'dan to'liq UI emas

3. **Toast komponent yo'q** — joriy kodda `toast.error(...)` chaqiruvlari `alert(...)` ga aylantirildi (Login, Register sahifalarida). Phase 2'da Toast'ni port qilish kerak.

4. **`{{var}}` → `{var}` konvertatsiya qilingan** — 4 ta translation faylida 4 ta kalit (`from_reviews`, `new_count`, `greeting`, `found_count`). Plural suffixlar yo'q.

5. **Next.js 16 deprecation:** build vaqtida `middleware` → `proxy` rename ogohlantirishi chiqadi. Hozircha ishlaydi (next-intl hali `middleware` ishlatadi). Phase 2'da `next-intl` `proxy` ga moslashganda rename qilamiz.

6. **Path alias:** `@/*` → `./*` (root). Hech qanday `~/*` yo'q. Strukturani `src/` o'rniga root'da tutamiz (user requested standard create-next-app layout).

7. **Eski Vite frontend `frontend/`'da hali ham mavjud va parallel ishlaydi** — siz uni o'chirmadingiz.

## Ertaga keyingi qadam — variantlar

### Variant A: Phase 2 Doctor (tavsiya etiladi — ko'p ma'lumot Doctor'da)
Yangi spec va plan yozish kerak, keyin 5-7 sahifa port:
- `/patients` (joriy `Patsant.tsx` — patient ro'yxati)
- `/patients/:id` (joriy `PatientDetailPage.tsx`)
- `/profile` (joriy `DoctorProfile.tsx`)
- `/profile/edit` (joriy `EditDoctorProfile.tsx`)
- `/appointments` (joriy `Appointments.tsx`)
- `/settings` (joriy `Settings.tsx`)
- Va MainLayout'ni `frontend/src/Layouts/MainLayout.tsx`'dan to'liq UI bilan port qilish

### Variant B: Phase 2 Patient
- `/calendar` (joriy `PatientAppointments.tsx`)
- `/history` (joriy `PatientHistory.tsx`)
- `/profile_pat` (joriy `PatientProfilePage.tsx`)
- `/doctors` (joriy `Doctors.tsx`)
- `/specialties` (joriy `Specialties.tsx`)
- `/booking` (joriy `Booking.tsx`)
- Va PatientLayout'ni to'liq UI bilan port qilish

### Variant C: Chat (WebSocket) — Phase 3
Bu ikkalasi uchun ham (doctor va patient) muhim. Joriy `frontend/src/api/chat.ts` va WebSocket manageri bor.

### Variant D: Toast komponent + Layout polish
Foundation polish: joriy Toast'ni port qilish, MainLayout va PatientLayout'ning to'liq UI'sini ko'chirish (sidebar items, header, etc.).

### Variant E: Mexanik port (tavsiya etilmadi, lekin tezroq)
Hamma 28+ sahifani `'use client'` qo'shib mexanik tarzda olib o'tish. Tez bo'ladi, lekin Next.js afzalligini olmaymiz va review qilish qiyin bo'ladi.

## Foydali fayllar

- **Spec:** `docs/superpowers/specs/2026-05-14-frontend-next-migration-design.md`
- **Phase 1 plan:** `docs/superpowers/plans/2026-05-14-frontend-next-phase-1.md`
- **Bu progress log:** `docs/superpowers/plans/2026-05-14-frontend-next-progress.md`
- **frontend-next README:** `frontend-next/README.md`

## Ertaga sessiyani boshlash uchun savol shabloni

> "Frontend-next migration Phase 2 ni boshlaymiz. Qaysi variantni xohlaysiz (A/B/C/D)? Spec va plan'ni shu progress log'dagi ma'lumotlar asosida yozing."

Yoki:

> "Doctor /profile sahifasini frontend/src/Pages/DoctorProfile.tsx'dan frontend-next'ga port qil."

(Birinchisi tavsiya etiladi — har bir sahifani alohida task qilish o'rniga, butun phase uchun reja tuzish samaraliroq.)
