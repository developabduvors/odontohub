# Phase 2c — PatientDetailPage sub-sections port

**Sana:** 2026-05-14
**Branch:** `patient/abduvoris`
**Avvalgi holat:** PatientDetailPage driver + PatientInfoSection allaqachon port qilingan (`commit 34540106`). 6 ta sub-section + ularning modal'lari hali stub (faqat "in development" matni chiqadi).

## Maqsad

`/patients/[id]` sahifasidagi 6 ta tab'ni real komponentlarga ulash. Vite `frontend/`'da ishlaydigan to'liq UX bilan teng bo'lishi kerak.

## Scope (port qilinadigan fayllar)

### Sub-sections (6 ta)

| Vite source | Lines | Next.js target |
|-------------|-------|----------------|
| `Patients/MedcardSection.tsx` | 251 | `components/Patients/MedcardSection.tsx` |
| `Patients/AllergySection.tsx` | 192 | `components/Patients/AllergySection.tsx` |
| `Patients/PrescriptionSection.tsx` | 163 | `components/Patients/PrescriptionSection.tsx` |
| `Patients/PaymentsSection.tsx` | 174 | `components/Patients/PaymentsSection.tsx` |
| `Patients/PhotosSection.tsx` | 129 | `components/Patients/PhotosSection.tsx` |
| `Patients/AppointmentsSection.tsx` | 110 | `components/Patients/AppointmentsSection.tsx` |

### Modal'lar (8 ta)

| Vite source | Lines | Next.js target |
|-------------|-------|----------------|
| `AddAllergyModal.tsx` | 133 | `components/Patients/AddAllergyModal.tsx` |
| `EditAllergyModal.tsx` | 126 | `components/Patients/EditAllergyModal.tsx` |
| `AddPrescriptionModal.tsx` | 145 | `components/Patients/AddPrescriptionModal.tsx` |
| `EditPrescriptionModal.tsx` | 136 | `components/Patients/EditPrescriptionModal.tsx` |
| `AddPaymentModal.tsx` | 150 | `components/Patients/AddPaymentModal.tsx` |
| `AddPhotoModal.tsx` | 195 | `components/Patients/AddPhotoModal.tsx` |
| `AddAppointmentModal.tsx` | 166 | `components/Patients/AddAppointmentModal.tsx` |

**Jami:** ~2070 satr UI kodi.

### API qatlami

`frontend-next/api/{allergies,prescriptions,payments,photos}.ts` allaqachon raw funksiyalar bilan mavjud, lekin **React Query hook'lari yo'q**. Buni qo'shamiz, chunki:
- Loyiha standartiga muvofiq (`api/profile.ts`, `api/appointments.ts` shu pattern'da)
- Cache invalidation va `useMutation` real ishlash uchun kerak
- Vite kodi `useState/useEffect/manual fetch` ishlatadi — Next.js'da bu antipattern (Hydration risk, lokal mode flaglari SSR'da `window` ni o'qiydi)

## Implement tartibi (har biri 1 commit)

1. **API hook'lari (`api/allergies.ts`)** — `useAllergies(patientId)` query + `useAddAllergy`, `useUpdateAllergy`, `useDeleteAllergy` mutation'lar
2. **`AllergySection` + 2 modal** — fetch/CRUD wiring, toast, lucide ikonlar
3. **API hook'lari (`api/prescriptions.ts`)** — query + 3 mutation
4. **`PrescriptionSection` + 2 modal**
5. **API hook'lari (`api/payments.ts`)** — query + getStats + 3 mutation
6. **`PaymentsSection` + 1 modal**
7. **API hook'lari (`api/photos.ts`)** — query (category param) + 3 mutation
8. **`PhotosSection` + 1 modal**
9. **`AppointmentsSection` + `AddAppointmentModal`** — `useMyAppointments` query'ni qayta ishlatish, mutation alohida
10. **`MedcardSection` (read-only)** — `usePatientMedcard` allaqachon bor, faqat UI ko'chirish
11. **`patients/[id]/page.tsx`** — 6 ta tab handler'larini real komponentlarga ulash

## Next.js-spetsifik moslashtirishlar (har bir fayl uchun)

- `import { useTranslation } from 'react-i18next'` → `import { useTranslations } from 'next-intl'`
  - `const { t } = useTranslation()` → `const t = useTranslations()`
  - `t('key')` ishlaydi, lekin `t('key', { var })` formati next-intl'da `t('key', { var })` (parametr nomi farq qilishi mumkin)
- `import { ... } from 'react-icons/fa'` kerak bo'lsa o'zgartirish yo'q (lucide ikonlar `lucide-react`'dan)
- `confirm()`, `alert()`, `window.*` faqat client'da ishlaydi — komponentlarning birinchi satri `'use client'` bo'lishi shart
- `localStorage` to'g'ridan-to'g'ri o'qish o'rniga `@/utils/auth`'dagi helper'lar — SSR'da xato bermaslik uchun
- `process.env.NEXT_PUBLIC_API_URL` — agar rasm yo'llarida `http://localhost:8000` hardcoded bo'lsa, almashtirish kerak

## Translation kalitlari

Vite kodda `patient_profile.allergies_view.*`, `patient_profile.prescriptions_view.*`, `patient_profile.payments_view.*`, `patient_profile.photos_view.*`, `patient_profile.appointments_view.*`, `patient_profile.medcard_view.*` kalitlari ishlatiladi. `messages/{uz,ru,en,kz}.json`'da mavjudligini tekshirish kerak — bo'lmasa, qo'shamiz.

## Verification

Har bir komponent port qilingandan keyin:
- `npm run build` — 0 ta TS xato, 47+ static sahifa
- `npm run dev` — `/uz/patients/1` ochib tabni almashtirib ko'rish (dev'da real backend kerak — `python run.py` ishlasin)
- Build qilmasdan bir vaqtning o'zida 11 ta commit qilmaymiz — har task'dan keyin `npx tsc --noEmit` bilan tezroq tekshirish ham mumkin

## Out of scope (kelajak Phase 2c'da)

- `NotesSection` + `AddNoteModal` — bu PatientDetailPage tab'i emas, alohida joyda ishlatiladi (`AppointmentDetailModal` ichida bo'lishi mumkin). Hozircha tegmaymiz.
- `AppointmentDetailModal` + `InProgressView` — Appointments sahifasidagi alohida task.
- `PrivacySettings` to'liq forma — Settings sahifasidagi alohida task.
- Tezroq.tsx modal'lari — Menu sahifasidagi alohida task.

## Ko'rib chiqilishi kerak

- React Query hook'larini har bir API fayliga qo'shaymizmi yoki ayrim section'larda raw fetch qoldiramizmi? (Tavsiya: hook qo'shish — barqarorlik)
- AppointmentsSection patientId bo'yicha appointment'larni filter qiladi. `useMyAppointments`'ni qayta ishlatamizmi yoki yangi `usePatientAppointments(patientId)` yozamizmi? (Tekshirish: backend `GET /api/patients/:id/appointments` bormi)
