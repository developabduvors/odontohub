# Frontend → Next.js Migration — Phase 3b (Discovery + Booking) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Vite patient **Discovery + Booking** flow (8 routes + their components + `api/search.ts`) into `frontend-next/` with 1:1 visual fidelity, completing gate 2 of Phase 3.

**Architecture:** Faithful Vite→Next port using the validated doctor-flow + 3a pattern. **The cited Vite source file IS the spec for each port** (mechanical, rule-driven transformation per spec §2 — not a redesign). Each Vite page becomes a thin `(patient)` route wrapper composing `'use client'` components ported per the transformation table. Tasks are dependency-ordered so shared components (DoctorCard, Booking parts, PatientAppointmentDetail parts) are ported once before their consumers.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl v4 (`useTranslations` full dotted keys, `@/i18n/navigation`), Redux Toolkit, React Query (`@/api/*` hooks), Tailwind v4, lucide-react + react-icons/fa. SSR-safe `localStorage`/`sessionStorage` (`typeof window` guard). Hardcoded RU/UZ strings stay as in Vite.

**Spec:** `docs/superpowers/specs/2026-05-16-frontend-next-phase-3-patient-design.md` (§3 sub-phase 3b, §4 decisions, §5 gap items).

**Testing note:** This repo has **no test runner** (root `CLAUDE.md`, `frontend-next/AGENTS.md`). User instruction overrides the TDD default. Per-task verification is `cd frontend-next && npx tsc --noEmit` (exit 0). The 3b gate task adds `npm run build` (exit 0, 0 new warnings, expected route delta) + a manual smoke test with the backend running. Do **not** add a test framework.

---

## The faithful-port transformation (apply to EVERY ported file — spec §2)

For each Vite source file, reproduce it verbatim into the target path with **only** these mechanical changes. Nothing else is changed (a Vite bug is reproduced, not fixed — spec §8).

| Vite | Next |
|---|---|
| `react-router-dom`: `useNavigate` | `useRouter` from `@/i18n/navigation` (`router.push(...)`, `router.back()` for `navigate(-1)`) |
| `react-router-dom`: `Link to=` | `Link href=` from `@/i18n/navigation` |
| `react-router-dom`: `useParams` | `useParams` from `next/navigation` |
| `react-router-dom`: `useLocation` / `location.state` | `sessionStorage` handoff — see **Handoff contract** below |
| `react-i18next` `useTranslation` → `const { t } = useTranslation()` | `next-intl` `useTranslations` → `const t = useTranslations()`; calls become full dotted `t('a.b.c')`. Two-arg fallback `t('k','Lit')` → keep `'Lit'` only if key absent in ru.json (see per-task i18n pre-flight) |
| relative import (`../components/...`, `../api/...`, `../types/...`) | `@/` alias |
| asset import (`import X from '../assets/...'`) | string path `/assets/...` (assets already in `frontend-next/public/assets/`) |
| `<img src={importedVar}>` | `<img src="/assets/...">` preceded by `{/* eslint-disable-next-line @next/next/no-img-element */}` |
| direct `localStorage` at module/render top | guard with `if (typeof window === 'undefined') return;` inside `useEffect`, or `@/utils/auth` helpers |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| hardcoded `localhost:8000` in image/file URLs | `process.env.NEXT_PUBLIC_API_URL` |
| component file top (interactive component) | add `'use client';` as first line |

**Route file pattern (confirmed from 3a + doctor flow):** `app/[locale]/(patient)/<route>/page.tsx`. The `(patient)/layout.tsx` already wraps `RoleGuard requiredRole="patient"` + `PatientLayout` — **do not add/modify it**. The page file is a thin wrapper; the `'use client'` directive lives in the ported component, not the page (mirror `(patient)/home/page.tsx`). Dynamic segment routes use `useParams` from `next/navigation` (mirror `(doctor)/chats/[id]/page.tsx`).

---

## Handoff contract (App Router has no router state — extends the 3a contract)

3a already writes these (consumed here):
- `gosmile:booking_doctor` → JSON of the chosen doctor object. **Written** by 3a `SuggestedDoctors`, and (3b) by `Doctors/DoctorsList` (its `onBook`), `SearchResultsPage`, `DoctorProfilePreview` (its "book" button). **Read + cleared** by `/booking`.
- `gosmile:doctors_specialty` → specialty string/id. **Written** by 3a `ServicesGrid` (label) and (3b) `SpecialtiesList` (specialty id). **Read + cleared** by `/doctors` (`DoctorsList`, replacing Vite `location.state?.specialtyId` → `activeSpecialtyId`).

3b adds these keys:
- `gosmile:preview_doctor` → JSON of the doctor object. **Written** by `Doctors/DoctorCard` (card-click, Vite `navigate('/my-dentist',{state:{doctor}})`). **Read + cleared** by `/my-dentist` (`DoctorProfilePreview`, Vite `location.state?.doctor`), with the Vite `useMemo` fallback to the first `useAllDentists()` entry preserved exactly. *(Added during CP1 execution: the plan's contract conflated this with `gosmile:booking_doctor`, but Vite's DoctorCard card-click and book-button are two distinct navigations to two different routes — they need separate keys.)*
- `gosmile:doctor_services_dentist_id` → dentist id (string). **Written** by `DoctorProfilePreview` (its "services" button, Vite `navigate('/doctor-services',{state:{dentist_id}})`). **Read + cleared** by `/doctor-services` (`DoctorServicesPage`, Vite `location.state?.dentist_id`).

**Crash-safety note (CP1):** next-intl `t()` *throws* `MISSING_MESSAGE` on an absent key (Vite's react-i18next returned the key string instead). Any ported dynamic-key call (e.g. `DoctorsList`'s `t(\`patient.specialties.items.${id}.name\`)`) must be guarded with `t.has(key) ? t(key) : <faithful fallback>` — this preserves "no crash" parity (spec §8) without changing happy-path output.

**Read+clear idiom** (replaces every Vite `location.state?.X`):
```tsx
const [handoff, setHandoff] = useState<any>(null);
useEffect(() => {
  if (typeof window === 'undefined') return;
  const raw = sessionStorage.getItem('gosmile:booking_doctor');
  if (raw) { try { setHandoff(JSON.parse(raw)); } catch {} sessionStorage.removeItem('gosmile:booking_doctor'); }
}, []);
```
For plain-string keys (`gosmile:doctors_specialty`, `gosmile:doctor_services_dentist_id`) skip `JSON.parse`. Preserve every Vite **fallback** when the value is absent (e.g. `Booking`/`DoctorProfilePreview` fall back to the first `useAllDentists()` entry via `useMemo` — keep that logic exactly).

**Write idiom** (replaces every Vite `navigate(path, { state: {...} })`):
```tsx
if (typeof window !== 'undefined') sessionStorage.setItem('gosmile:booking_doctor', JSON.stringify(doctor));
router.push(paths.booking);
```

**Video-call button** (`DoctorProfilePreview`, Vite `navigate('/video-call',{state:{participant}})`): `/video-call` is **3d, not 3b**. Stub it exactly like the doctor-side precedent (progress log Phase 2d): `toast.info(t('patient.alerts.function_in_development'))` via `@/components/Shared/Toast`. Do **not** route to `/video-call` in 3b.

---

## Pre-flight (verified true on branch `patient/abduvoris` — no change needed)

- `frontend-next/lib/paths.ts` already exports **all** 3b paths: `doctors`, `specialties`, `searchResults`, `myDentist`, `doctorServices`, `doctorCases`, `booking`, `checkupPreview`. **No paths.ts edit in 3b.**
- `(patient)/layout.tsx` = `RoleGuard requiredRole="patient"` + `PatientLayout`. New routes only add `page.tsx`. **No layout edit.**
- Already-ported, reused as-is: `@/api/profile` (`useAllDentists`), `@/api/appointments` (`useCreateAppointment`, inferred `Appointment`), `@/api/services` (`useServices`, `Service`), `@/api/complaints` (`submitComplaint`, `ComplaintData`), `@/components/Shared/Toast`, `@/utils/auth`, `@/lib/paths`, `@/i18n/navigation`. ⚠ For appointment-shaped data import the **hook return type**, never `@/types/patient`'s legacy `Appointment` (it diverges — see `frontend-next-appointment-type` memory).
- **Absent → must be created**: `frontend-next/api/search.ts`; component dirs `components/Doctors/`, `components/Specialties/`, `components/Booking/`, `components/Complaints/`, `components/PatientAppointmentDetail/` (none exist yet).
- i18n: `messages/ru.json` has `patient.specialties.{title,found_count,view_btn,items}` and `patient.alerts.{fill_required_fields,function_in_development}`. Any other `t('...')` key a ported file uses must be pre-flighted per task (grep the Vite file's `t(` calls → if key missing in ru.json, hardcode the literal as Vite's 2-arg fallback did; faithful, deep-merge fallback also prevents `MISSING_MESSAGE` crash).
- `tsconfig.json` has no `noUnusedLocals`. Established eslint rule: every `<img>` gets the preceding `{/* eslint-disable-next-line @next/next/no-img-element */}` comment.

Per-route component dependency (verified via Vite imports):

| Route | Vite page (source of truth) | Components to port | API |
|---|---|---|---|
| `/doctors` | `Pages/Doctors.tsx` (34) | `Doctors/{DoctorCard,DoctorFilters,DoctorsList}` | `useAllDentists`; reads `gosmile:doctors_specialty` |
| `/specialties` | `Pages/Specialties.tsx` (33) | `Specialties/SpecialtiesList` | — |
| `/search` | `Pages/SearchResultsPage.tsx` (159) | reuses `Doctors/DoctorCard` | **new `api/search.ts`**; writes `gosmile:booking_doctor` |
| `/my-dentist` | `Pages/DoctorProfilePreview.tsx` (232) | `Complaints/ComplaintModal` | `useAllDentists`; reads doctor handoff; writes `gosmile:booking_doctor` & `gosmile:doctor_services_dentist_id`; video btn = Toast stub |
| `/doctor-services` | `Pages/DoctorServicesPage.tsx` (103) | — | `@/api/api`, `Toast`; reads `gosmile:doctor_services_dentist_id` |
| `/doctor-cases` | `Pages/DoctorCasesPage.tsx` (77) | — | — |
| `/booking` | `Pages/Booking.tsx` (204) | `Booking/{CommentInput,CustomDropdown,TimePicker,BookingCalendar}` | `useCreateAppointment`,`useAllDentists`,`useServices`,`Toast`; reads `gosmile:booking_doctor` |
| `/booking/checkup-preview` | `Pages/CheckupBookingPreview.tsx` (84) | `PatientAppointmentDetail/{DoctorInfoCard,AppointmentDetailsCard,PriceCard,ReviewModal}` | — |

---

## Tasks (dependency-ordered)

Each task: (a) port the listed Vite source file(s) → exact target path applying **the transformation table** + **handoff contract**; (b) per-file i18n pre-flight (`grep -nE "t\\(['\\\"]" <vite file>` → confirm each key in `messages/ru.json` or hardcode the literal); (c) `cd frontend-next && npx tsc --noEmit` → **exit 0, no output**; (d) commit with the given message. Component files use **default** export/import (match 3a). Route `page.tsx` files mirror `(patient)/home/page.tsx`.

### Task 1: Port `api/search.ts`

**Files:** Create `frontend-next/api/search.ts`

- [ ] **Step 1** — Port `frontend/src/api/search.ts` (38 lines) verbatim; only change `import type { Doctor } from "../types/patient"` → `from "@/types/patient"`; `import api from "./api"` stays (`@/api/api` is the same relative file). Exports `interface Service`, `useSearchDoctors(query)`, `useSearchServices(query)` unchanged. (`Service` here is a module-scoped export; the name also exists in `@/api/services` & `@/types/patient` but they are never co-imported — no collision.)
- [ ] **Step 2** — `cd frontend-next && npx tsc --noEmit` → exit 0.
- [ ] **Step 3** — Commit:
```bash
git add frontend-next/api/search.ts
git -c commit.gpgsign=false commit -m "feat(frontend-next): port api/search.ts (useSearchDoctors/useSearchServices)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 2: Port the shared `Doctors/` components

**Files:** Create `frontend-next/components/Doctors/DoctorCard.tsx` (Vite 90), `.../DoctorFilters.tsx` (Vite 352), `.../DoctorsList.tsx` (Vite 223)

- [ ] **Step 1** — Port `frontend/src/components/Doctors/DoctorCard.tsx` per the transformation table (`'use client'`; `@/` aliases; asset→string+eslint comment; any `Link`/`useNavigate`→`@/i18n/navigation`).
- [ ] **Step 2** — Port `frontend/src/components/Doctors/DoctorFilters.tsx` same way. (352 lines — filter UI; no router state expected, but apply table to anything present.)
- [ ] **Step 3** — Port `frontend/src/components/Doctors/DoctorsList.tsx`. Apply the **read+clear** idiom for its `useLocation()` (Vite `DoctorsList.tsx:13`, the `gosmile:doctors_specialty` consumer) and the **write** idiom for `DoctorsList.tsx:173` `navigate(paths.booking,{state:{doctor:doc}})` → `gosmile:booking_doctor`. `paths` import → `@/lib/paths`.
- [ ] **Step 4** — i18n pre-flight for the 3 files (grep `t(` → confirm/hardcode). `cd frontend-next && npx tsc --noEmit` → exit 0.
- [ ] **Step 5** — Commit:
```bash
git add frontend-next/components/Doctors/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port Doctors components (DoctorCard/DoctorFilters/DoctorsList)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 3: Wire `/doctors` route

**Files:** Create `frontend-next/app/[locale]/(patient)/doctors/page.tsx`

- [ ] **Step 1** — Port `frontend/src/Pages/Doctors.tsx` (34) into the route. Keep its `is_first_time` `localStorage` welcome-banner logic but guard with `typeof window`; it composes `<DoctorsList/>` from `@/components/Doctors/DoctorsList`. Hardcoded RU banner text stays. Page wrapper mirrors `(patient)/home/page.tsx` (the `'use client'` localStorage/effect logic means this page component itself needs `'use client'` — faithful to Vite which used hooks).
- [ ] **Step 2** — `cd frontend-next && npx tsc --noEmit` → exit 0.
- [ ] **Step 3** — Commit:
```bash
git add "frontend-next/app/[locale]/(patient)/doctors/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /doctors route (DoctorsList + first-time banner)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 4: Port `Specialties/SpecialtiesList` + wire `/specialties`

**Files:** Create `frontend-next/components/Specialties/SpecialtiesList.tsx` (Vite 78); `frontend-next/app/[locale]/(patient)/specialties/page.tsx`

- [ ] **Step 1** — Port `frontend/src/components/Specialties/SpecialtiesList.tsx` per transformation table. Uses `patient.specialties.{found_count,view_btn,items}` — all present in ru.json (pre-flight confirmed); keep `useTranslations`.
- [ ] **Step 2** — Port `frontend/src/Pages/Specialties.tsx` (33) into the route: header back-button `navigate(-1)` → `router.back()` from `@/i18n/navigation`; `goBackIcon` asset → `/assets/img/icons/GoBack.svg` + eslint comment; `useTranslation`→`useTranslations`; title `patient.specialties.title` (present). Composes `<SpecialtiesList/>`. Page component needs `'use client'` (uses `useRouter`/`useTranslations`).
- [ ] **Step 3** — `cd frontend-next && npx tsc --noEmit` → exit 0.
- [ ] **Step 4** — Commit:
```bash
git add frontend-next/components/Specialties/ "frontend-next/app/[locale]/(patient)/specialties/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): port SpecialtiesList + wire /specialties

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 5: Wire `/search` route

**Files:** Create `frontend-next/components/PatientSearch/SearchResultsView.tsx` + `frontend-next/app/[locale]/(patient)/search/page.tsx`

*(CP2 deviation: Next 16 requires a `useSearchParams` client component to sit under a `<Suspense>` boundary on a prerendered route — without it the build hard-errors with the CSR-bailout message, violating the gate's 0-warning rule. Verified against `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/use-search-params.md`. So the port splits into a `'use client'` `SearchResultsView` + a **server** `page.tsx` that wraps it in `<Suspense fallback={spinner}>`, instead of the plan's original single `'use client'` page.)*

- [x] **Step 1** — Ported `frontend/src/Pages/SearchResultsPage.tsx` (159) into `components/PatientSearch/SearchResultsView.tsx` (`'use client'`). Reuses `@/components/Doctors/DoctorCard`; `api/search` → `@/api/search`; `useSearchParams` from `next/navigation` (reads `q`); `useNavigate`→`useRouter` from `@/i18n/navigation` (`navigate(-1)`→`router.back()`, service "Band qilish" `navigate(paths.doctors)`→`router.push`); `:32` `navigate(paths.booking,{state:{doctor}})` → **write** `gosmile:booking_doctor` + `router.push(paths.booking)`; `DoctorImg` asset → string. `app/[locale]/(patient)/search/page.tsx` = server component wrapping `<Suspense>` + `<SearchResultsView/>`.
- [x] **Step 2** — i18n pre-flight: SearchResultsPage uses no `t(` keys (all hardcoded Uzbek) — none needed. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `16dce2b3` "feat(frontend-next): wire /search route (SearchResultsView + Suspense + api/search)".

### Task 6: Port `Complaints/ComplaintModal`

**Files:** Create `frontend-next/components/Complaints/ComplaintModal.tsx` (Vite 96)

- [x] **Step 1** — Ported `frontend/src/components/Complaints/ComplaintModal.tsx` → `components/Complaints/ComplaintModal.tsx`. Only changes: `'use client'` first line, `../../api/complaints`→`@/api/complaints`, `../../components/Shared/Toast`→`@/components/Shared/Toast`. No router state, no assets.
- [x] **Step 2** — i18n pre-flight: zero `t(` calls (all hardcoded Uzbek) — none needed. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `fad37f5b`.
```bash
git add frontend-next/components/Complaints/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port Complaints/ComplaintModal

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 7: Wire `/my-dentist` route

**Files:** Create `frontend-next/app/[locale]/(patient)/my-dentist/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/DoctorProfilePreview.tsx` (232) → `app/[locale]/(patient)/my-dentist/page.tsx` (`'use client'`). `lucide-react` stays; `@/components/Complaints/ComplaintModal`, `@/api/profile useAllDentists`, `@/components/Shared/Toast`, `@/lib/paths`, `@/utils/auth getUser`. `DentistImg`→`/assets/img/photos/Dentist.png` const + eslint comment on `<img>`; **read+clear** `gosmile:preview_doctor` (JSON.parse) into `doctorFromState` state via `useEffect` (replaces `location.state?.doctor`), useMemo deps `[dentists, doctorFromState]` unchanged; `user_data` read via SSR-safe `getUser()` in same `useEffect`→`isDentist` state (avoids hydration mismatch on the conditional "Записаться" button); book→**write** `gosmile:booking_doctor` (exact Vite object) + `router.push(paths.booking)`; services→**write** `gosmile:doctor_services_dentist_id` (`String(id)`) + `router.push(paths.doctorServices)`; cases→`router.push(paths.doctorCases)`; video→Toast stub `toast.info(t('patient.alerts.function_in_development'))`; `navigate(-1)`→`router.back()`. **Plan-prose deviation (faithful-port doctrine):** plan task/contract note says "keep useMemo fallback to first `useAllDentists()` entry" — but Vite `DoctorProfilePreview.tsx` has **no** `dentists[0]` fallback (`source = matchedDoctor || doctorFromState || {}`; that fallback is `Booking.tsx`'s, Task 11). Per the plan's governing rule "the cited Vite source file IS the spec", ported the file's actual logic verbatim; fabricating an absent fallback would be un-faithful and change behavior (placeholder "Врач" vs a random first dentist when no handoff).
- [x] **Step 2** — i18n pre-flight: Vite had 0 `t(` calls; only introduced key is the plan-mandated `patient.alerts.function_in_development` (present in ru.json). `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `035f5f39`.
```bash
git add "frontend-next/app/[locale]/(patient)/my-dentist/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /my-dentist (DoctorProfilePreview + ComplaintModal, video stub)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 8: Wire `/doctor-services` route

**Files:** Create `frontend-next/app/[locale]/(patient)/doctor-services/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/DoctorServicesPage.tsx` (103) → `app/[locale]/(patient)/doctor-services/page.tsx` (`'use client'`). `useNavigate/useLocation`→`useRouter` from `@/i18n/navigation`; `location.state?.dentist_id`→**read+clear** `gosmile:doctor_services_dentist_id` via `useEffect`, `Number(raw)`→`dentist_id` state (absent→`undefined`→`/services/` all, Vite fallback preserved); `[dentist_id]` effect dep unchanged (re-fetches when handoff resolves); `../api/api`→`@/api/api`, Toast→`@/components/Shared/Toast`; `user_data`→SSR-safe `getUser()`→`isDentist` state (same useEffect, hydration-safe like Task 7); `navigate(-1)`→`router.back()`, `navigate('/booking')` (no state)→`router.push(paths.booking)`.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls (hardcoded Russian). `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `906dad23`.
```bash
git add "frontend-next/app/[locale]/(patient)/doctor-services/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /doctor-services (DoctorServicesPage)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 9: Wire `/doctor-cases` route

**Files:** Create `frontend-next/app/[locale]/(patient)/doctor-cases/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/DoctorCasesPage.tsx` (77) → `app/[locale]/(patient)/doctor-cases/page.tsx` (`'use client'`). `useNavigate`→`useRouter` from `@/i18n/navigation`, `navigate(-1)`→`router.back()`, two `<img>` + eslint-disable comments. **tsc-compat deviation (faithful §8 vs per-task gate):** Vite/esbuild skips typecheck so `useState([])`→`never[]` + `caseItem.{id,title,...}` never errored; frontend-next runs real `tsc` → TS2339 on `never`. Added a `CaseItem` interface (shape fully determined by the file's own property reads) + `useState<CaseItem[]>([])`. Zero runtime change (array stays `[]`, only empty-state renders). Mirrors Task 8's inline `interface Service`.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `8babefa1`.
```bash
git add "frontend-next/app/[locale]/(patient)/doctor-cases/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /doctor-cases (DoctorCasesPage)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 10: Port the shared `Booking/` components

**Files:** Create `frontend-next/components/Booking/CommentInput.tsx` (19), `.../CustomDropdown.tsx` (127), `.../TimePicker.tsx` (67), `.../BookingCalendar.tsx` (106)

- [x] **Step 1** — Ported all four from `frontend/src/components/Booking/` → `frontend-next/components/Booking/`. Zero relative imports (only `react` + `react-icons/fa`), no router/API/assets/`t()`. Only change per file: `'use client'` first line (all use `useState`/`useRef`/`useEffect`). `react-icons/fa` kept verbatim.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls (hardcoded Russian). `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `d75c91e8`.
```bash
git add frontend-next/components/Booking/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port Booking components (CommentInput/CustomDropdown/TimePicker/BookingCalendar)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 11: Wire `/booking` route

**Files:** Create `frontend-next/app/[locale]/(patient)/booking/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/Booking.tsx` (204) → `app/[locale]/(patient)/booking/page.tsx` (`'use client'`). Composes `@/components/Booking/*`; APIs `@/api/{appointments,profile,services}`, `@/components/Shared/Toast`, `@/lib/paths`, `@/utils/auth getUser`. `location.state?.doctor`→**read+clear** `gosmile:booking_doctor` (JSON.parse)→`preSelectedDoctor` state + seeds `selectedDoctor` (Vite name-match `useEffect` deps `[preSelectedDoctor, doctors]` unchanged). **Plan-prose vs source — user decision "Follow plan prose":** Vite `:100` actually does `navigate('/calendar')` with **no** state, and Vite has **no** `dentists[0]` fallback (plan prose was inaccurate on both — see AskUserQuestion). Per user's explicit choice, implemented the plan's *intended* redesign: success → synthesize an `appointment`-shaped `previewPayload` (matches Vite `CheckupBookingPreview` mock shape) → **write** `gosmile:checkup_preview` (JSON) + `router.push(paths.checkupPreview)`. No fabricated `dentists[0]` fallback added (none in source; name-match effect is the only doctor-resolution path, faithful). `location.state?.patientId`→`patientFromState=undefined` (no patient-side patientId writer in 3b; Vite default branch `|| userData.patient_id` preserved). Dead render-top `currentUser` localStorage read (Vite:29, unreferenced + SSR ReferenceError hazard) removed per transformation table (zero behavior change). In-handler `userData`→SSR-safe `getUser()`. `useTranslation`→`useTranslations`, `navigate(-1)`→`router.back()`, dropped unused `React` default import.
- [x] **Step 2** — i18n pre-flight: only `t("patient.alerts.fill_required_fields")` (present, ru.json:753). `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `3f1afe56`.
```bash
git add "frontend-next/app/[locale]/(patient)/booking/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /booking route (Booking + calendar/timepicker/dropdown)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 12: Port the shared `PatientAppointmentDetail/` components

**Files:** Create `frontend-next/components/PatientAppointmentDetail/DoctorInfoCard.tsx` (48), `.../AppointmentDetailsCard.tsx` (36), `.../PriceCard.tsx` (31), `.../ReviewModal.tsx` (74)

- [x] **Step 1** — Ported the four `CheckupBookingPreview` imports from `frontend/src/components/PatientAppointmentDetail/` → `frontend-next/components/PatientAppointmentDetail/` (ActionButtons/CheckupDetailView/ReviewButton skipped — 3c). All `'use client'`. **DoctorInfoCard**: `useNavigate`→`useRouter` `@/i18n/navigation`, `Doctor` type→`@/types/patient` (Doctor, not the divergent Appointment — safe), `navigate('/my-dentist',{state:{doctor}})`→**write** `gosmile:preview_doctor` (JSON) + `router.push(paths.myDentist)` (closes loop with Task 7's read+clear), `<img>`+eslint comment. **AppointmentDetailsCard/PriceCard**: pure presentational, only `'use client'` added. **ReviewModal**: `isOpen`-gated, `useState`+`FaStar`, only `'use client'` added — references **no** API (Vite parent just `console.log`s `onSubmit`), so no `@/api/reviews` import (faithful).
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls (hardcoded Russian). `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `dc9dd427`.
```bash
git add frontend-next/components/PatientAppointmentDetail/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port PatientAppointmentDetail cards (DoctorInfo/Details/Price/ReviewModal)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 13: Wire `/booking/checkup-preview` route

**Files:** Create `frontend-next/app/[locale]/(patient)/booking/checkup-preview/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/CheckupBookingPreview.tsx` (84) → `app/[locale]/(patient)/booking/checkup-preview/page.tsx` (`'use client'`). `FaArrowLeft` stays; `DentistImg`→`/assets/img/photos/Dentist.png` const (no `<img>` in this file — used only inside FALLBACK doctor.image, rendered by DoctorInfoCard which has its own eslint comment); component imports→`@/components/PatientAppointmentDetail/*`. **Per user decision "Follow plan prose":** Vite's static mock `appointment` (lines 14–33) extracted to `FALLBACK_APPOINTMENT`; **read+clear** `gosmile:checkup_preview` (JSON.parse) via `useEffect` into `appointment` state, falling back to the mock when absent (faithful "Vite absent-value fallback"). Consumes the Task 11 payload (matching shape). `useNavigate`/`navigate(-1)`→`useRouter`/`router.back()`, dropped unused `React` default import.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `be63f1d2`.
```bash
git add "frontend-next/app/[locale]/(patient)/booking/checkup-preview/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /booking/checkup-preview (CheckupBookingPreview)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 14: 3b build verification + manual smoke test (GATE 2)

**Files:** none (verification only)

- [x] **Step 1: Production build** — `npm run build` → **exit 0**, `✓ Compiled successfully in 5.1s`, `Finished TypeScript` (no errors), **99/99 static pages** (= 67 pre-3b + 8 routes × 4 locales, exact expected delta). All 8 new routes prerendered **SSG `●` ×4 locales** (incl. `/search` — the CP2 Suspense split kept it SSG instead of the predicted `ƒ`; `/booking*` SSG too since handoffs are read in client `useEffect`). **0 new warnings** — only the pre-existing `middleware`→`proxy` next-intl v4 deprecation (present every prior phase, documented in `frontend_next_migration` memory), not introduced by 3b.
- [ ] **Step 2: Manual smoke test** — Terminal 1 `cd backend && python run.py`; Terminal 2 `cd frontend-next && npm run dev`. Log in as **patient**; compare side-by-side with Vite (`frontend/`, `localhost:5173`):
  1. From `/home`: ServicesGrid tile → `/doctors` shows the filtered list (specialty handoff applied, then cleared — refresh shows unfiltered); SuggestedDoctors card → `/booking` with that doctor preselected.
  2. `/doctors`: DoctorFilters work; first-time banner shows once if `is_first_time`; "book" → `/booking` preselected.
  3. `/specialties`: list + back button; titles translated; locale switch (`/ru`,`/en`,`/kz`) no `MISSING_MESSAGE`.
  4. `/search?q=...` (type in 3a SearchBar, Enter): doctor + service results; result → `/booking` preselected.
  5. `/my-dentist`: renders dentist (handoff or first-dentist fallback); ComplaintModal opens/submits; "services" → `/doctor-services` (correct dentist); video button → "function in development" toast (NOT navigation).
  6. `/doctor-services`, `/doctor-cases`: render; back button works.
  7. `/booking`: calendar/timepicker/dropdown/comment work; submit creates appointment (check backend) → `/booking/checkup-preview` shows the just-booked summary (DoctorInfo/Details/Price/ReviewModal). Refresh on checkup-preview → Vite-parity fallback (no crash).
  8. All 8 routes render inside `PatientLayout` chrome, mobile + desktop responsive, layout not broken.
- [~] **Step 2: Manual smoke test** — user-performed visual side-by-side vs Vite (Terminal 1 `cd backend && python run.py`; Terminal 2 `cd frontend-next && npm run dev`; log in as patient). **Pending user** (gate-1 precedent: user may waive with "davom et"). Note for tester: per the user's "Follow plan prose" decision, Booking success now → `/booking/checkup-preview` (NOT Vite's `/calendar`) showing the just-booked summary; this is an intentional redesign, not a Vite regression.
- [x] **Step 3: No commit; STOPPED at gate.** Build gate (Step 1) ✓ automatic. Progress log + `frontend_next_migration` memory updated. **Stopped for gate-2 user approval before 3c** — not started.

---

## Out of scope (3b)

- 3c (`/calendar`, `/appointment/:id`, `/history`, `/profile_pat`, `/treatments`) and 3d (chats, `/patient/notifications`, `/video-call`) — each its own gated plan file.
- `PatientAppointmentDetail/{ActionButtons,CheckupDetailView,ReviewButton}` — 3c.
- Real `/video-call` — 3d (3b stubs the button with a toast).
- Backend / auth model / CORS changes; deleting or altering Vite `frontend/`.
- New UX/visual design; converting hardcoded RU/UZ strings to next-intl keys.
- `git push` (local commits only, like prior phases, unless user asks).

## Self-Review

- **Spec coverage:** spec §3 sub-phase 3b table → Tasks 1–13 cover all 8 routes + the `api/search.ts` gap item (§5) is Task 1; §2 transformation table → the explicit "faithful-port transformation" section applied per task; §4 decision 1 (faithful 1:1, hardcoded strings stay) → every task ports the cited Vite file verbatim modulo the table; §4 decision 3 (video-call = 3d) → Task 7 Toast stub, video-call out of scope; §6 success criteria → Task 14 (`tsc` per task, `build` + side-by-side smoke gate, progress/memory update at gate); §8 risks → handoff contract section (appointment/dentist-specific keys, read-then-clear, Vite fallbacks preserved), faithful-bug note, `(patient)` RoleGuard already separates `/notifications` vs `/patient/notifications`.
- **Placeholder scan:** none. This is a *faithful mechanical port* — the cited exact Vite source path + the closed transformation table + handoff contract fully determine each file's content (project precedent: phase-2d plan, which shipped, used this same source-path+rules format rather than inlining ~2k lines). No "TBD/TODO", no "add error handling" (Vite's exact error handling is reproduced), no "similar to Task N" (each task names its own exact source + target + transformations). Component dirs/order chosen so no task references an unported file: shared parts (Task 2 Doctors, Task 6 ComplaintModal, Task 10 Booking, Task 12 PatientAppointmentDetail) precede their route consumers (Tasks 3/5, 7, 11, 13).
- **Type consistency:** `useAllDentists`/`useCreateAppointment`/`useServices`/`submitComplaint`/`useSearchDoctors`/`useSearchServices` names match the verified `@/api/*` exports; appointment data uses the hook's inferred type, never `@/types/patient` `Appointment` (divergence memo). sessionStorage keys are consistent end-to-end: `gosmile:booking_doctor` (written Task 2 DoctorsList.onBook / Task 5 / Task 7 book-btn, read Task 11), `gosmile:preview_doctor` (written Task 2 DoctorCard card-click, read Task 7), `gosmile:doctors_specialty` (written 3a + Task 4 SpecialtiesList, read Task 2/3 DoctorsList), `gosmile:doctor_services_dentist_id` (written Task 7, read Task 8), `gosmile:checkup_preview` (written Task 11, read Task 13) — every reader has a named writer (3a or an earlier 3b task). All routes use `@/i18n/navigation` + `next/navigation` `useParams`/`useSearchParams` exactly as the doctor flow + 3a do.
