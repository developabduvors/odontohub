# Phase 2d — Doctor flow yakunlash

**Sana:** Reja 2026-05-15 (yozildi), boshlash ertaga
**Branch:** `patient/abduvoris`
**Maqsad:** Doctor tomonini 100% yopish, keyin Phase 3 Patient flow'ga o'tish.

## Avvalgi sessiyada qilingan ishlar (eslatma)

Phase 2c PatientDetailPage to'liq port qilindi (`patient/abduvoris` push qilingan):
- 6 ta sub-section + 8 ta modal, ~2070 satr
- React Query hooks: `useAllergies`, `usePrescriptions`, `usePatientPayments`, `usePatientPhotos` + ularning mutation'lari
- 6 ta commit: `a645a827..0f5e02e4` + `7a0d0000` (plan doc)

---

## Qoldiqlar — jami 6 ta task, ~2067 satr UI

### 1. Mavjud stub'larni real qilish (avval qilamiz — eng oson natija)

#### 1a. `/menu` Tezroq tugmalari
**Fayl:** `components/Bosh sahifa/Tezroq.tsx` (satr 23, 25)

Hozir:
```tsx
toast.info(t('patient.alerts.function_in_development'));
toast.info(t('patient.alerts.function_in_development'));
```

Kerak:
- `AppointmentModal` (`components/Appointments/AppointmentModal.tsx`) — **mavjud**, ulash kifoya
- `AddPatientModal` (`components/Patients/AddPatientModal.tsx`) — **mavjud**, ulash kifoya
- `AddNoteModal` (Vite: `frontend/src/components/Patients/AddNoteModal.tsx`, 291 satr) — **port kerak**. NotesSection (152 satr) qayerda ishlatilishini aniqlash kerak — ehtimol `AppointmentDetailModal` ichida.

**Estimate:** 1 commit, ~300 satr (AddNoteModal port + 3 ta state wiring)

#### 1b. `/appointments` AppointmentCard bosish
**Fayl:** `app/[locale]/(doctor)/appointments/page.tsx` (satr 100)

Hozir:
```tsx
const handleAptClick = () => {
  toast.info(t('patient.alerts.function_in_development'));
};
```

Kerak:
- `AppointmentDetailModal.tsx` (281 satr) — port qilish
- `InProgressView.tsx` (376 satr) — port qilish
- Modal ichidan reschedule/cancel/in-progress holatlariga o'tish

**Estimate:** 2 commit (1 modal, 1 InProgressView), ~660 satr

---

### 2. Yangi sahifalar (4 ta)

#### 2a. `/notifications` (eng oson)
**Vite source:** `frontend/src/Pages/Notifications.tsx` (178 satr)
**Target:** `app/[locale]/(doctor)/notifications/page.tsx`

- API hook'lar: `api/notifications.ts`'da `useNotifications`, `useMarkAsRead` mavjud (Phase 2a'dan)
- List view, mark-as-read, filter (read/unread)

**Estimate:** 1 commit, ~180 satr

#### 2b. `/analytics` (Analitic)
**Vite source:** `frontend/src/Pages/Analitic.tsx` (202 satr) + `components/Analytics/AppointmentsChart.tsx`
**Target:** `app/[locale]/(doctor)/analytics/page.tsx`

- Chart kerak — Vite'da qaysi chart kutubxonasi ishlatilganligini tekshirish (apexcharts? recharts?)
- SSR'da chart kutubxonalari ko'pincha ishlamaydi — `next/dynamic({ ssr: false })` kerak bo'lishi mumkin

**Estimate:** 1-2 commit, ~250 satr

#### 2c. `/analytics/finance` (Finance)
**Vite source:** `frontend/src/Pages/Finance.tsx` (341 satr)
**Target:** `app/[locale]/(doctor)/analytics/finance/page.tsx`

- Stat cards + payments jadval + filter
- `api/payments.ts`'da kerakli hook'lar **bor** (bugun yozildi)

**Estimate:** 1 commit, ~350 satr

#### 2d. `/chats` + `/chats/:id` (eng murakkab — WebSocket)
**Vite source:**
- `frontend/src/Pages/Chats.tsx` (398 satr)
- `frontend/src/api/chat.ts` — REST + WebSocket manager
- Backend: `app/routers/chat.py` `/api/ws/chat/{room_id}` endpoint
- `frontend/src/components/Chat/*` (sub-komponentlar)

**Yangi infra kerak:**
- `api/chat.ts` — REST hook'lar + WebSocket connection helper
- WebSocket'ni client-only ishlatish kerak (`useEffect` ichida, SSR'da yo'q)
- Token avtorizatsiya WebSocket query param orqali (yoki Sec-WebSocket-Protocol header)

**Estimate:** 3-4 commit, ~600+ satr. **Bu eng katta task — alohida spec yozish tavsiya etiladi.**

---

## Tavsiya etilgan tartib

```
1.  Tezroq stub'larini real qilish (AppointmentModal + AddPatientModal ulash, AddNoteModal port)
2.  AppointmentDetailModal port
3.  InProgressView port
4.  /notifications sahifasi
5.  /analytics sahifasi (chart bilan)
6.  /analytics/finance sahifasi
7.  /chats sahifasi (REST + ro'yxat)
8.  /chats/:id (WebSocket integration)
9.  Phase 2 Doctor yakuniy progress log update + memory update
10. Push
```

Har task'dan keyin: `npx tsc --noEmit` + ehtiyojga qarab `npm run build`. Har biri alohida commit.

---

## Sinash uchun

```powershell
# Terminal 1
cd backend
python run.py

# Terminal 2
cd frontend-next
npm run dev
```

Brauzer:
- Dentist login → `/uz/menu` (Tezroq tugmalari)
- `/uz/appointments` → kartani bosish (AppointmentDetailModal)
- `/uz/notifications`, `/uz/analytics`, `/uz/analytics/finance`, `/uz/chats`

Build:
```powershell
cd frontend-next
npm run build
```
Hozir 47 static + 1 dynamic. Phase 2d'dan keyin 51 static + 2 dynamic (`/chats/[id]`) bo'lishi kerak.

---

## Phase 3 (Doctor yakunlangandan keyin)

Patient flow boshlanadi — 17 ta sahifa Vite'da bor, Next.js'da faqat `/home` stub:

```
/calendar, /history, /profile_pat, /appointment/:id, /patient/chats,
/patient/chats/:id, /patient/chats/:id/profile, /doctors, /specialties,
/patient/notifications, /booking, /booking/checkup-preview, /my-dentist,
/treatments, /doctor-services, /doctor-cases, /video-call, /search
```

Patient layout ham (`PatientLayout.tsx` 54 satr minimal) Vite'dagi to'liq UI bilan port qilinishi kerak.

---

## Foydali fayllar

- **Phase 2c plan (kecha bajarilgan):** `docs/superpowers/plans/2026-05-14-frontend-next-phase-2c-patient-detail.md`
- **Phase 2c progress log:** `docs/superpowers/plans/2026-05-14-frontend-next-progress.md`
- **Phase 2 Doctor plan:** `docs/superpowers/plans/2026-05-14-frontend-next-phase-2-doctor.md`
- **Vite routes (haqiqat manbai):** `frontend/src/Routes/index.tsx`
- **Vite paths constant:** `frontend/src/Routes/path.ts`

## Ertaga sessiyani boshlash

Mana shu fayldagi tartib bo'yicha boshlang:
> "Phase 2d boshlaymiz. Avval Tezroq stub'larini real qilamiz — AppointmentModal va AddPatientModal allaqachon bor, AddNoteModal'ni port qilib uchchovini ulash kerak."
