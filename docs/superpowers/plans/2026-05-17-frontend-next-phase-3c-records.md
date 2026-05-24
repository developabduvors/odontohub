# Frontend → Next.js Migration — Phase 3c (Records) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Vite patient **Records** flow (5 routes + their components + the `Shared/EditProfileModal` gap item) into `frontend-next/` with 1:1 visual fidelity, completing gate 3 of Phase 3.

**Architecture:** Faithful Vite→Next port using the validated doctor-flow + 3a/3b pattern. **The cited Vite source file IS the spec for each port** (mechanical, rule-driven transformation per spec §2 — not a redesign; a Vite bug is reproduced, not fixed — spec §8). Each Vite page becomes a thin `(patient)` route wrapper composing `'use client'` components ported per the transformation table. Tasks are dependency-ordered so shared components are ported before their route consumers.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl v4 (`useTranslations` full dotted keys, `useLocale`, `@/i18n/navigation`), Redux Toolkit, React Query (`@/api/*` hooks), Tailwind v4, lucide-react + react-icons/fa. SSR-safe `localStorage` (`typeof window` guard / `@/utils/auth`). Hardcoded RU/UZ strings stay as in Vite.

**Spec:** `docs/superpowers/specs/2026-05-16-frontend-next-phase-3-patient-design.md` (§3 sub-phase 3c, §4 decisions, §5 gap items).

**Testing note:** This repo has **no test runner** (root `CLAUDE.md`, `frontend-next/AGENTS.md`). Per-task verification is `cd frontend-next && npx tsc --noEmit` (exit 0). The 3c gate task adds `npm run build` (exit 0, 0 new warnings, expected route delta) + a manual smoke test with the backend running. Do **not** add a test framework.

---

## The faithful-port transformation (apply to EVERY ported file — spec §2)

| Vite | Next |
|---|---|
| `react-router-dom`: `useNavigate` | `useRouter` from `@/i18n/navigation` (`router.push(...)`, `router.replace(...)` for `{replace:true}`, `router.back()` for `navigate(-1)`) |
| `react-router-dom`: `Link to=` | `Link href=` from `@/i18n/navigation` |
| `react-router-dom`: `useParams` | `useParams` from `next/navigation` |
| `react-router-dom`: `useLocation` / `location.state` | `sessionStorage` handoff (none needed in 3c — see Handoff contract) |
| `react-i18next` `useTranslation` → `const { t } = useTranslation()` | `next-intl` `useTranslations` → `const t = useTranslations()`; calls become full dotted `t('a.b.c')`. Two-arg fallback `t('k','Lit')` → keep `'Lit'` only if key absent in ru.json (per-task i18n pre-flight) |
| `react-i18next` `i18n.changeLanguage(code)` + current `i18n.language` | next-intl locale switch — see **Locale-switch contract** below |
| relative import (`../components/...`, `../api/...`, `../types/...`, `../Routes/path`, `../store/...`) | `@/` alias (`../Routes/path` → `@/lib/paths`) |
| asset import (`import X from '../assets/...'`) | string path `/assets/...` (assets already in `frontend-next/public/assets/`) |
| `<img src={...}>` | precede with `{/* eslint-disable-next-line @next/next/no-img-element */}` |
| direct `localStorage` at module/render top | guard with `if (typeof window === 'undefined') return;` inside `useEffect`, or `@/utils/auth` helpers (`getToken`/`getUser`) |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| component file top (interactive component) | add `'use client';` as first line |

**Route file pattern (confirmed from 3a/3b + doctor flow):** `app/[locale]/(patient)/<route>/page.tsx`. The `(patient)/layout.tsx` already wraps `RoleGuard requiredRole="patient"` + `PatientLayout` — **do not add/modify it**. Each page that uses hooks/router is itself `'use client'` (mirror `(patient)/booking/page.tsx`). Dynamic segment `/appointment/[id]` uses `useParams` from `next/navigation` (mirror `(doctor)/chats/[id]/page.tsx`).

---

## Handoff contract (3c adds NO new sessionStorage keys)

All 3c navigation is either a plain `router.push`/`router.back` or a URL **path param** (`/appointment/:id`). No `location.state` is read or written by any 3c Vite source file (verified). Specifically:

- `PatientAppointments` cards (`Upcoming/PastAppointmentCard`) Vite `navigate(paths.patientAppointmentDetail.replace(":id", appointment.id.toString()))` → `router.push(paths.patientAppointmentDetail.replace(":id", String(appointment.id)))`. `paths` → `@/lib/paths` (`patientAppointmentDetail: '/appointment/:id'`, verified present — no paths.ts edit).
- `/appointment/[id]` reads the id via `useParams` from `next/navigation` (no handoff).
- `ActionButtons` Vite `navigate('/calendar')` (×2, after cancel/reschedule) → `router.push(paths.patientCalendar)` (`/calendar` exists after Task 3).
- **`ActionButtons` Vite `navigate('/video-call', { state: { participant, appointmentId } })`** — `/video-call` is **3d, not 3c**. Stub it exactly like the 3b/2d precedent (`my-dentist` video button): replace the onClick with `toast.info(t('patient.alerts.function_in_development'))` via `@/components/Shared/Toast`. Do **not** route to `/video-call`, do **not** add a sessionStorage key. (`patient.alerts.function_in_development` is present in `ru.json` — used in 3b.)

**Crash-safety note:** next-intl `t()` *throws* `MISSING_MESSAGE` on an absent key (Vite's react-i18next returned the key string). Per-task i18n pre-flight (below) prevents this; the `request.ts` ru.json deep-merge fallback is the backstop.

---

## Locale-switch contract (replaces Vite `i18n.changeLanguage` — only used by `/profile_pat`)

`PatientProfilePage.tsx` uses react-i18next `i18n.changeLanguage(code)` + `i18n.language`. The **established frontend-next pattern** is in the Welcome page `app/[locale]/page.tsx` (lines 4, 50, 62, 64) — reproduce it exactly:

- import `{ useRouter, usePathname } from '@/i18n/navigation'` and `{ useLocale } from 'next-intl'`.
- current locale: `const locale = useLocale();` (replaces every `i18n.language`).
- switch: `localStorage.setItem('appLanguage', code); router.replace(pathname, { locale: code });` (replaces `i18n.changeLanguage(code)` + the Vite `localStorage.setItem("appLanguage", code)`), guarded with `typeof window` for the localStorage write.

---

## Pre-flight (verified true on branch `patient/abduvoris` — no change needed)

- `frontend-next/lib/paths.ts` already exports **all** 3c paths: `patientCalendar: '/calendar'`, `patientAppointmentDetail: '/appointment/:id'`, `patientHistory: '/history'`, `patientProfileSettings: '/profile_pat'`, `treatments: '/treatments'`, `login: '/login'`. **No paths.ts edit in 3c.**
- `(patient)/layout.tsx` = `RoleGuard requiredRole="patient"` + `PatientLayout`. New routes only add `page.tsx`. **No layout edit.**
- Already-ported, reused as-is (verified): `@/api/appointments` (`useMyAppointments`, `useAppointment`, `Appointment`), `@/api/profile` (`useAllDentists`, `usePatientProfile`, `useUpdatePatient`), `@/api/medcard` (`useMyMedcard` → `MedcardData{patient,allergies,prescriptions,appointments}`; type exports `MedcardAppointment`, `MedcardPrescription`, `MedcardAllergy`), `@/api/api` (default axios), `@/components/Complaints/ComplaintModal` (3b), `@/components/PatientAppointmentDetail/{DoctorInfoCard,AppointmentDetailsCard,PriceCard}` (3b), `@/components/Shared/Toast`, `@/utils/auth` (`getToken`/`getUser`), `@/store/slices/userSlice` (`clearUser`), `@/lib/paths`, `@/i18n/navigation`, `@/types/patient` (`Appointment` L42, `AppointmentDetail` L60, `Language` L95, `MenuItem` L101, `SupportItem` L110).
  - ⚠ `PatientAppointments.tsx` / `Upcoming/PastAppointmentCard` use **`Appointment` from `@/types/patient`** as the *UI card* shape (the page maps backend `useMyAppointments()` data INTO it). This is correct here — that legacy UI `Appointment` is exactly the cards' prop type. The "never import `@/types/patient` Appointment" memo applies to *backend-DTO-shaped* data only; here it IS the UI shape. Keep `@/types/patient`.
- **Absent → must be created**: `frontend-next/components/Shared/EditProfileModal.tsx`; component dirs `components/PatientAppointments/`, `components/PatientHistory/`; `components/PatientAppointmentDetail/{ActionButtons,ReviewButton}.tsx` (the 4 cards already exist from 3b).
- **Excluded orphans (verified imported by NO 3c route — YAGNI, not ported):** `PatientAppointmentDetail/CheckupDetailView.tsx` (grep: imported only by itself; `PatientAppointmentDetail.tsx` imports `ActionButtons`+`ReviewButton` only) and `PatientHistory/XRaySection.tsx` (`PatientHistory.tsx` imports only `ProfileCard,MedicalInfoCard,PrescriptionCard,TreatmentsTable`; none of those 4 import `XRaySection`). Mirrors the 3b orphan-route precedent.
- i18n: per-task pre-flight — `grep -nE "t\(['\"]" <vite file>` → for each key confirm it exists in `messages/ru.json`; if absent, hardcode the literal exactly as Vite's 2-arg fallback / `|| 'Lit'` did (faithful; deep-merge also prevents `MISSING_MESSAGE`).
- `tsconfig.json` has no `noUnusedLocals`. Established eslint rule: every `<img>` gets the preceding eslint-disable comment.

Per-route component dependency (verified via Vite imports):

| Route | Vite page (source of truth) | Components to port | API / notes |
|---|---|---|---|
| `/calendar` | `Pages/PatientAppointments.tsx` (94) | `PatientAppointments/{AppointmentTabs,UpcomingAppointmentCard,PastAppointmentCard}` | `useMyAppointments`; `Appointment` UI type; `DentistImg` asset |
| `/appointment/[id]` | `Pages/PatientAppointmentDetail.tsx` (206) | `PatientAppointmentDetail/{ActionButtons,ReviewButton}` (+ reused 3b `DoctorInfoCard,AppointmentDetailsCard,PriceCard` + `Complaints/ComplaintModal`) | `useAppointment`,`useAllDentists`; `AppointmentDetail` type; `useParams`; render-top `localStorage` → `getToken()` |
| `/history` | `Pages/PatientHistory.tsx` (128) | `PatientHistory/{ProfileCard,MedicalInfoCard,PrescriptionCard,TreatmentsTable}` | `useMyMedcard`; `ProfileCard` uses `Dentist.png` asset |
| `/profile_pat` | `Pages/PatientProfilePage.tsx` (363) | `Shared/EditProfileModal` (gap) | `usePatientProfile`,`useUpdatePatient`,`clearUser`,`Toast`; locale-switch contract; `DentistImg` asset |
| `/treatments` | `Pages/TreatmentsListPage.tsx` (88) | — | independent; no API/handoff/i18n |

---

## Tasks (dependency-ordered)

Each task: (a) port the listed Vite source file(s) → exact target path applying **the transformation table** + **handoff/locale contracts**; (b) per-file i18n pre-flight; (c) `cd frontend-next && npx tsc --noEmit` → **exit 0, no output**; (d) commit with the given message. Component files use **default** export/import (match 3a/3b). Route `page.tsx` files mirror `(patient)/booking/page.tsx`.

### Task 1: Port `Shared/EditProfileModal`

**Files:** Create `frontend-next/components/Shared/EditProfileModal.tsx`

- [x] **Step 1** — Ported `frontend/src/components/Shared/EditProfileModal.tsx` (170) → `frontend-next/components/Shared/EditProfileModal.tsx`. `'use client'`; `import DentistImg`→`const DentistImg = "/assets/img/photos/Dentist.png"`; eslint-disable comment on the avatar `<img>`. No router/API/`t()`. Default export.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `3df3fff7`.
```bash
git add frontend-next/components/Shared/EditProfileModal.tsx
git -c commit.gpgsign=false commit -m "feat(frontend-next): port Shared/EditProfileModal

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 2: Port the shared `PatientAppointments/` components

**Files:** Create `frontend-next/components/PatientAppointments/AppointmentTabs.tsx`, `.../UpcomingAppointmentCard.tsx`, `.../PastAppointmentCard.tsx`

- [x] **Step 1** — Ported `AppointmentTabs.tsx`: `'use client'`; `useTranslation`→`useTranslations`. No router/assets.
- [x] **Step 2** — Ported `UpcomingAppointmentCard.tsx`: `'use client'`; `lucide-react` stays; `useNavigate`→`useRouter` `@/i18n/navigation`; `paths`→`@/lib/paths`; `Appointment`→`@/types/patient`; `navigate(...replace(":id", id.toString()))`→`router.push(...replace(":id", String(appointment.id)))`; `<img>`+eslint comment.
- [x] **Step 3** — Ported `PastAppointmentCard.tsx`: same + `useTranslation`→`useTranslations`; `lucide-react Star` stays.
- [x] **Step 4** — i18n pre-flight: `patient.appointments.{upcoming_tab,past_tab,doctor_label,date_time_label}` all present in ru.json (692–695) — no hardcoding. `@/types/patient` `Appointment` (L42–58) has all consumed fields (statusText/newDate/commentTitle/etc). `npx tsc --noEmit` → exit 0.
- [x] **Step 5** — Committed `ba2cbfce`.
```bash
git add frontend-next/components/PatientAppointments/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port PatientAppointments components (AppointmentTabs/UpcomingCard/PastCard)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 3: Wire `/calendar` route

**Files:** Create `frontend-next/app/[locale]/(patient)/calendar/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/PatientAppointments.tsx` (94) → `app/[locale]/(patient)/calendar/page.tsx` (`'use client'`). `useNavigate`→`useRouter` (`navigate(-1)`→`router.back()`); `useTranslation`→`useTranslations`; `DentistImg`→string const; `Appointment as UIAppointment`→`@/types/patient`; `useMyAppointments`→`@/api/appointments`; composes Task-2 components. Mojibake Cyrillic literals (`"РџСЂРёС‘Рј Сѓ РІСЂР°С‡Р°"` etc.) reproduced byte-for-byte (faithful, encoding not fixed). No `location.state`.
- [x] **Step 2** — i18n pre-flight: `patient.appointments.{title,success_status,cancelled_status,rescheduled_status,comment_label}` present (ru.json 690–698) → plain `t()`; `pending_status` + `empty_list` **absent** → `t.has(k) ? t(k) : <exact Vite literal>` ("Kutilmoqda" / "РЈ РІР°СЃ РїРѕРєР° РЅРµС‚ РїСЂРёС‘РјРѕРІ"). `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `d3eb15ec`.
```bash
git add "frontend-next/app/[locale]/(patient)/calendar/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /calendar route (PatientAppointments)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 4: Port `PatientAppointmentDetail/{ActionButtons,ReviewButton}`

**Files:** Create `frontend-next/components/PatientAppointmentDetail/ActionButtons.tsx`, `.../ReviewButton.tsx`

- [x] **Step 1** — Ported `ActionButtons.tsx` (235): `'use client'`; `useNavigate`→`useRouter` `@/i18n/navigation` + `useParams` `next/navigation`; `useTranslation`→`useTranslations`; `toast`→`@/components/Shared/Toast`; `lucide-react` stays. `localStorage.getItem('access_token')`→`getToken()` (`@/utils/auth`); appointments localStorage kept inside isLocalMode branches (event-handler/client-only). Dynamic `import('../../api/api')`→`import('@/api/api')` (×2). `navigate('/calendar')` (×2)→`router.push(paths.patientCalendar)` (`@/lib/paths`). `navigate('/video-call',{state})`→**Toast stub** `toast.info(t('patient.alerts.function_in_development'))`.
- [x] **Step 2** — Ported `ReviewButton.tsx` (169): `'use client'`; `useParams`→`next/navigation`; `useTranslation`→`useTranslations`; `FaStar`+`Loader2` stay; `api`/`toast`→`@/`; `import React, { useState } from 'react'` (default React added to satisfy `React.FC` under strict tsc — ComplaintModal precedent). Hardcoded Uzbek toasts/arrays kept.
- [x] **Step 3** — i18n pre-flight: all keys present in ru.json (`cancel_confirm` 682, `rate_quality/desc` 683-684, `review_success/thanks_review/placeholder_review/send_review` 685-688, `appointment_cancelled/select_new_date/appointment_rescheduled` 749-751, `function_in_development` 763) → plain `t()`, no hardcoding. `npx tsc --noEmit` → exit 0.
- [x] **Step 4** — Committed `edcb3fb5`.
```bash
git add frontend-next/components/PatientAppointmentDetail/ActionButtons.tsx frontend-next/components/PatientAppointmentDetail/ReviewButton.tsx
git -c commit.gpgsign=false commit -m "feat(frontend-next): port PatientAppointmentDetail ActionButtons + ReviewButton (video stub)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 5: Wire `/appointment/[id]` route

**Files:** Create `frontend-next/app/[locale]/(patient)/appointment/[id]/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/PatientAppointmentDetail.tsx` (206) → `app/[locale]/(patient)/appointment/[id]/page.tsx` (`'use client'`). `FaArrowLeft` stays; `useNavigate`→`useRouter` `@/i18n/navigation` + `useParams` `next/navigation` (`navigate(-1)`→`router.back()`); `useTranslation`→`useTranslations`; `DentistImg`→string const; component imports→`@/components/PatientAppointmentDetail/*` (3b cards + Task-4 ActionButtons/ReviewButton) + `@/components/Complaints/ComplaintModal`; `useAppointment`/`useAllDentists`→`@/api/{appointments,profile}`; `AppointmentDetail`→`@/types/patient`. Render-top `localStorage.getItem('access_token')`→`getToken()` (SSR→null→appointmentData branch; isLocalMode `JSON.parse(localStorage.appointments)` client-only). Vite's 3-way branching (isLocalMode/appointmentData/fallback) reproduced verbatim, incl. all hardcoded RU/UZ literals. tsc confirms AppointmentDetail accepts built objects + doctor→DoctorInfoCard `Doctor` (faithful type parity).
- [x] **Step 2** — i18n pre-flight: `patient.appointment_detail.{rate_quality,rate_desc}` present (ru.json 683-684) → plain `t()`. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `1ccda2f3`.
```bash
git add "frontend-next/app/[locale]/(patient)/appointment/[id]/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /appointment/[id] (PatientAppointmentDetail)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 6: Port the shared `PatientHistory/` components

**Files:** Create `frontend-next/components/PatientHistory/ProfileCard.tsx`, `.../MedicalInfoCard.tsx`, `.../PrescriptionCard.tsx`, `.../TreatmentsTable.tsx` (XRaySection EXCLUDED — orphan, see pre-flight)

- [x] **Step 1** — Ported `ProfileCard.tsx`: `'use client'`; `import avatar`→`const avatar = "/assets/img/photos/Dentist.png"`; `<img>`+eslint comment.
- [x] **Step 2** — Ported `MedicalInfoCard.tsx`: `'use client'`; `MedcardAllergy` type import→`@/api/medcard`.
- [x] **Step 3** — Ported `PrescriptionCard.tsx`: `'use client'`; `MedcardPrescription`→`@/api/medcard`.
- [x] **Step 4** — Ported `TreatmentsTable.tsx`: `'use client'`; `useState`+`lucide-react` stay; `MedcardAppointment`→`@/api/medcard`.
- [x] **Step 5** — i18n pre-flight: 0 `t(` calls (hardcoded Uzbek/Russian). `npx tsc --noEmit` → exit 0.
- [x] **Step 6** — Committed `22f14ea5`.
```bash
git add frontend-next/components/PatientHistory/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port PatientHistory components (Profile/MedicalInfo/Prescription/TreatmentsTable)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 7: Wire `/history` route

**Files:** Create `frontend-next/app/[locale]/(patient)/history/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/PatientHistory.tsx` (128) → `app/[locale]/(patient)/history/page.tsx` (`'use client'`). `import React, { useMemo }` stays (`React.FC`); `lucide-react` stays; `useNavigate`→`useRouter` (`navigate(-1)`×2→`router.back()`); `useMyMedcard`→`@/api/medcard`; component imports→`@/components/PatientHistory/*` (Task 6). `toUTC`/`formatDate`/`diffDays`/`treatmentGroups` reproduced verbatim. No `t()`/assets/`location.state`.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `746ba80a`.
```bash
git add "frontend-next/app/[locale]/(patient)/history/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /history route (PatientHistory medcard)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 8: Wire `/profile_pat` route

**Files:** Create `frontend-next/app/[locale]/(patient)/profile_pat/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/PatientProfilePage.tsx` (363) → `app/[locale]/(patient)/profile_pat/page.tsx` (`'use client'`). `useDispatch/useSelector`→`@/store/hooks` `useAppDispatch`/`useAppSelector` (RegisterView precedent; dropped `RootState` import — typed hook); `clearUser`→`@/store/slices/userSlice`; `paths`→`@/lib/paths`; `useNavigate`→`useRouter`+`usePathname` `@/i18n/navigation` (`navigate(-1)`→`router.back()`, `navigate(paths.login,{replace})`→`router.replace(paths.login)`); `useTranslation`→`useTranslations`+`useLocale`; **locale-switch contract**: `i18n.language`→`locale` (3×), `i18n.changeLanguage(code)`→`localStorage.setItem('appLanguage',code)` (guarded) + `router.replace(pathname,{locale:code})`; `DentistImg`→string const; `Language/MenuItem/SupportItem`→`@/types/patient`; `EditProfileModal`→`@/components/Shared/EditProfileModal` (Task 1); `usePatientProfile/useUpdatePatient`→`@/api/profile`; `toast`→`@/components/Shared/Toast`. `useEffect` localStorage guarded `if (typeof window==='undefined') return;`; `handleSaveProfile` access_token→`getToken()`; `handleLogout`/`changeLanguage` localStorage writes `typeof window` guarded. Avatar `<img>`+eslint comment. **tsc-compat:** Vite `React.ChangeEvent` (relied on global React) → `import { ..., type ChangeEvent }` + `ChangeEvent<HTMLInputElement>` (minimal, behavior-identical).
- [x] **Step 2** — i18n pre-flight: `patient.profile.{title,gender,male,female,edit,logout,language,notification,select_language,settings,support}` (ru.json 652-662) + `settings.support_items.{privacy_policy,faq,contact,about}` (172-175) all present → plain `t()`; Vite hardcoded literals ("Дата рождения","Местоположение") kept. `npx tsc --noEmit` → exit 0.
- [x] **Step 3** — Committed `db9426d3`.
```bash
git add "frontend-next/app/[locale]/(patient)/profile_pat/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /profile_pat (PatientProfilePage + EditProfileModal, locale switch)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 9: Wire `/treatments` route

**Files:** Create `frontend-next/app/[locale]/(patient)/treatments/page.tsx`

- [x] **Step 1** — Ported `frontend/src/Pages/TreatmentsListPage.tsx` (88) → `app/[locale]/(patient)/treatments/page.tsx` (`'use client'`). `lucide-react ArrowLeft` stays; `useNavigate`→`useRouter` `@/i18n/navigation` (`navigate(-1)`→`router.back()`). Local `interface TreatmentDetail` + `const treatments: TreatmentDetail[] = []` reproduced verbatim (explicitly typed, no `never[]`). Cyrillic literals (Лечения / Промежуток / Статус / Приёмов / Оплата / Завершено / В процессе / Отменено) + double-space className kept byte-for-byte. No API/handoff/`t()`/assets.
- [x] **Step 2** — i18n pre-flight: 0 `t(` calls. `npx tsc --noEmit` → exit 0, no output.
- [x] **Step 3** — Committed `0d1cf19f`.
```bash
git add "frontend-next/app/[locale]/(patient)/treatments/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire /treatments route (TreatmentsListPage)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

### Task 10: 3c build verification + manual smoke test (GATE 3)

**Files:** none (verification only)

- [x] **Step 1: Production build** — `cd frontend-next && npm run build` → **exit 0**, `✓ Compiled successfully in 20.8s`, TypeScript finished clean. Only warning is the pre-existing `middleware`→`proxy` next-intl deprecation (**NOT new** — documented in `frontend_next_migration` memory); **0 new warnings**. Route delta as expected: **99 → 115 static pages** (+16 = 4 SSG routes ×4 locales). `/calendar`,`/history`,`/profile_pat`,`/treatments` = SSG `●` ×4 (uz/ru/en/kz each); `/appointment/[id]` = dynamic `ƒ` (matches `/patients/[id]`, `/chats/[id]`). Exit 0 + 0 new warnings + expected delta all met.
- [ ] **Step 2: Manual smoke test** — Terminal 1 `cd backend && python run.py`; Terminal 2 `cd frontend-next && npm run dev`. Log in as **patient**; compare side-by-side with Vite (`frontend/`, `localhost:5173`):
  1. `/calendar`: upcoming/past tabs switch; cards render from `useMyAppointments`; tap a card → `/appointment/<id>`. Back button works.
  2. `/appointment/<id>`: renders the appointment (API or local-mode); active appt shows ActionButtons (Связаться/Перенести/Отменить + reschedule/cancel modals); completed appt shows ReviewButton inline + complaint button (ComplaintModal opens). **Video/«Онлайн консультация» button → "function in development" toast, NOT navigation.** Cancel/Reschedule success → returns to `/calendar`.
  3. `/history`: medcard loads (ProfileCard/MedicalInfoCard/PrescriptionCard/TreatmentsTable); error/empty states render; back works.
  4. `/profile_pat`: profile loads; EditProfileModal opens/saves (`updatePatient`); language modal switches locale (URL `/uz|/ru|/en|/kz` prefix changes, `appLanguage` persisted, no `MISSING_MESSAGE`); logout clears auth → `/login`.
  5. `/treatments`: renders (empty list state); back works.
  6. All 5 routes render inside `PatientLayout` chrome, mobile + desktop responsive, layout not broken.
- [ ] **Step 3: No commit; STOP at gate.** Verification only. If build fails or smoke shows a regression vs Vite, fix under the relevant earlier task and re-run Steps 1–2. When 3c passes, **stop and report to the user for gate 3 approval** before starting 3d. Then update `docs/superpowers/plans/2026-05-14-frontend-next-progress.md` and the `frontend_next_migration` memory.

---

## Out of scope (3c)

- 3d (`/patient/chats`, `/patient/chats/:id`, `/patient/chats/:id/profile`, `/patient/notifications`, `/video-call`) — its own gated plan (spec §3 3d). 3c stubs the video button with a toast.
- `PatientAppointmentDetail/CheckupDetailView.tsx` and `PatientHistory/XRaySection.tsx` — verified orphans (imported by no 3c route), excluded per YAGNI.
- Backend / auth model / CORS changes; deleting or altering Vite `frontend/`.
- New UX/visual design; converting hardcoded RU/UZ strings (incl. Vite mojibake) to next-intl keys.
- `git push` (local commits only, like prior phases, unless user asks).

## Self-Review

- **Spec coverage:** spec §3 sub-phase 3c table → Tasks 3/5/7/8/9 cover all 5 routes; §5 gap item `Shared/EditProfileModal` → Task 1; shared component groups (Task 2 PatientAppointments, Task 4 PatientAppointmentDetail action/review, Task 6 PatientHistory) precede their route consumers (Tasks 3, 5, 7) — no task references an unported file; §2 transformation table → explicit section applied per task; §4 decision 1 (faithful 1:1, hardcoded strings stay, incl. Vite Cyrillic mojibake) → every task ports the cited Vite file verbatim modulo the table; §3 3d decision (video-call = 3d) → Task 4 Toast stub, /video-call out of scope; §6 success criteria → Task 10 (`tsc` per task, `build` + side-by-side smoke gate, progress/memory update at gate); §8 risks → `(patient)` RoleGuard separates patient routes; new i18n keys pre-flighted per task with ru.json deep-merge backstop; faithful-bug note (mojibake/orphans reproduced/excluded with rationale).
- **Placeholder scan:** none. Faithful mechanical port — cited exact Vite source path + closed transformation table + handoff/locale contracts fully determine each file (project precedent: 3b plan, which shipped, used this same source-path+rules format). No "TBD/TODO", no "add error handling" (Vite's exact handling reproduced), no "similar to Task N" (each task names its own exact source/target/transforms). Orphan exclusions (`CheckupDetailView`, `XRaySection`) verified by grep and documented so no task references them.
- **Type consistency:** `useMyAppointments`/`useAppointment`/`useAllDentists`/`usePatientProfile`/`useUpdatePatient`/`useMyMedcard`/`clearUser` names match verified `@/api/*` & `@/store/slices/userSlice` exports. `Appointment`(UI card) & `AppointmentDetail` & `Language`/`MenuItem`/`SupportItem` are real `@/types/patient` exports (L42/60/95/101/110). `MedcardAppointment`/`MedcardPrescription`/`MedcardAllergy` are real `@/api/medcard` exports. `paths.{patientCalendar,patientAppointmentDetail,patientHistory,patientProfileSettings,treatments,login}` all present in `@/lib/paths` (no edit). No new sessionStorage keys (3c uses URL params + plain push only); `/video-call` stubbed not routed. Locale switch uses the exact Welcome-page pattern (`useLocale`/`usePathname`/`router.replace(pathname,{locale})`). All routes use `@/i18n/navigation` + `next/navigation` `useParams` exactly as 3a/3b + doctor flow.
