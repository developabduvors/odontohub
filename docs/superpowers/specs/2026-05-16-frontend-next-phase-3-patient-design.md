# Frontend → Next.js Migration — Phase 3 (Patient Flow) Design

**Sana:** 2026-05-16
**Branch:** `patient/abduvoris`
**Holat:** Doctor flow 100% port qilingan (Phase 1 + 2a-2d + chats WebSocket). Phase 3 = patient flow — hali boshlanmagan.
**Spec turi:** Faithful Vite→Next port (yangi UX dizayn emas).

---

## 1. Maqsad (Goal)

Vite `frontend/`'dagi patient (bemor) oqimini — **19 ta route** + `PatientLayout`/`PatientNavbar` chrome — `frontend-next/`'ga to'liq, 1:1 vizual sodiqlik bilan port qilish. Backend (FastAPI) o'zgarmaydi. Eski Vite `frontend/` parallel ishlashda davom etadi, faza yakunigacha prod'da qoladi.

Bu spec doctor flow'da tasdiqlangan port patternini patient flow'ga qayta qo'llaydi. Yangi arxitektura ixtiro qilinmaydi.

## 2. Tasdiqlangan port pattern (qaytariladi, o'zgartirilmaydi)

Har bir Vite komponent/sahifa quyidagicha ko'chiriladi (Phase 2 progress log'da tasdiqlangan):

| Vite | Next |
|---|---|
| `react-router-dom` (`useNavigate`, `useParams`, `Link`) | `@/i18n/navigation` (locale-aware `useRouter`, `usePathname`, `Link`) + Next `useParams` |
| `react-i18next` (`useTranslation`) | `next-intl` (`useTranslations`) — faqat mavjud kalitlar uchun; Vite'dagi hardcoded RU/UZ matnlar **hardcoded qoladi** |
| Nisbiy import (`../components/...`) | `@/` alias |
| Asset import (`import img from '...'`) | `/public/...` string path |
| Komponent fayli boshida | `'use client'` (interaktiv komponentlar) |
| `localStorage` to'g'ridan-to'g'ri | `@/utils/auth.ts` SSR-safe helperlar (`getToken`/`getUser`) yoki `typeof window` guard |
| `import.meta.env.VITE_*` | `process.env.NEXT_PUBLIC_*` |
| `react-router` `location.state` | `sessionStorage` handoff (App Router'da `location.state` yo'q) |
| Hardcoded `localhost:8000` (rasm/file URL) | `process.env.NEXT_PUBLIC_API_URL` |

**i18n eslatma:** yangi `t('...')` kalit kerak bo'lsa, avval `messages/ru.json`'ga qo'shiladi (canonical, 100% to'liq). `request.ts` ru.json'ni har locale ostiga deep-merge qiladi — uz/en/kz'dagi bo'shliq RU'ga degrade bo'ladi, crash emas.

**Layout eslatma:** har patient sahifa `PatientLayout` ichida render bo'ladi. Full-screen sahifalar (chat detail, video-call) balandlikni layout chrome'iga moslab hisoblashi kerak (doctor `ChatsView` patterni: `100dvh-<chrome>`).

## 3. Scope — 4 ta gated sub-faza (bitta spec, bitta plan)

Doctor Phase 2 (2a→2d) patterni: bitta spec, bitta plan, har sub-faza oxirida `npm run build` + foydalanuvchi smoke testi (gate).

### Sub-faza 3a — Foundation (gate 1)

| Route | Vite manba | Komponentlar |
|---|---|---|
| (chrome) | `Layouts/PatientLayout.tsx` + `components/Bosh sahifa/PatientNavbar.tsx` | bottom nav (mobil) / sidebar (desktop) |
| `/home` | `Pages/PatientHome.tsx` | `PatientHome/{SearchBar,UpcomingAppointment,SuggestedDoctors,ServicesGrid,QuickActionsGrid}` |

`(patient)/layout.tsx` (hozir minimal) to'liq `PatientLayout` chrome'iga almashtiriladi; `(patient)/home/page.tsx` stub real `PatientHome` kompozitsiyasiga almashtiriladi.

### Sub-faza 3b — Discovery + Booking (gate 2)

| Route | Vite manba | Asosiy bog'liqliklar |
|---|---|---|
| `/doctors` | `Doctors.tsx` | `Doctors/{DoctorsList,DoctorCard,...}` |
| `/specialties` | `Specialties.tsx` | `Specialties/SpecialtiesList` |
| `/search` | `SearchResultsPage.tsx` | `Doctors/DoctorCard`, **`api/search.ts` (port kerak)** |
| `/my-dentist` | `DoctorProfilePreview.tsx` | `Complaints/ComplaintModal`, `api/profile` (`useAllDentists`) |
| `/doctor-services` | `DoctorServicesPage.tsx` | `api/api`, `Shared/Toast` |
| `/doctor-cases` | `DoctorCasesPage.tsx` | (mustaqil) |
| `/booking` | `Booking.tsx` | `Booking/{BookingCalendar,TimePicker,CustomDropdown,CommentInput}`, `api/{appointments,profile,services}` |
| `/booking/checkup-preview` | `CheckupBookingPreview.tsx` | `PatientAppointmentDetail/{DoctorInfoCard,AppointmentDetailsCard,PriceCard,ReviewModal}` |

### Sub-faza 3c — Records (gate 3)

| Route | Vite manba | Asosiy bog'liqliklar |
|---|---|---|
| `/calendar` | `PatientAppointments.tsx` | `PatientAppointments/{AppointmentTabs,UpcomingAppointmentCard,PastAppointmentCard}`, `api/appointments` |
| `/appointment/:id` | `PatientAppointmentDetail.tsx` | `PatientAppointmentDetail/*`, `Complaints/ComplaintModal`, `api/{appointments,profile}` |
| `/history` | `PatientHistory.tsx` | `PatientHistory/{ProfileCard,MedicalInfoCard,PrescriptionCard,TreatmentsTable}`, `api/medcard` |
| `/profile_pat` | `PatientProfilePage.tsx` | **`Shared/EditProfileModal` (port kerak)**, `api/profile` (`usePatientProfile`,`useUpdatePatient`), `Shared/Toast` |
| `/treatments` | `TreatmentsListPage.tsx` | (mustaqil) |

### Sub-faza 3d — Comms (gate 4)

| Route | Vite manba | Asosiy bog'liqliklar |
|---|---|---|
| `/patient/chats` | `PatientChats.tsx` | `PatientChats/{ChatHeader,ChatListItem}`, `api/{appointments,chat}` |
| `/patient/chats/:id` | `PatientChatDetail.tsx` | `PatientChatDetail/{ChatDetailHeader,...}`, reused `Chat/MessageBubble`, `api/chat` |
| `/patient/chats/:id/profile` | `ChatProfilePage.tsx` | `ChatProfile/{ProfileHeader,ProfileInfo,MediaTabs,MediaGrid,FilesList,VoiceMessagesList,LinksList}` |
| `/patient/notifications` | `Notifications.tsx` (shared) | `api/notifications` — doctor `/notifications` allaqachon port qilingan; route patient layout'da qayta ishlatiladi |
| `/video-call` | `VideoCallPage.tsx` | real `getUserMedia` local preview + sessionStorage handoff |

## 4. Texnik qarorlar (foydalanuvchi tasdiqladi)

1. **Approach:** faithful 1:1 port, tasdiqlangan pattern. Genuine arxitektura alternativasi yo'q. Hardcoded RU/UZ matnlar Vite'dagidek qoladi.
2. **Patient chat (3d):** patient-specific komponentlar alohida port qilinadi (doctor `ChatsView`'ga majburlanmaydi — boshqa grouping/UX: `dentist_id` vs `patient_id`, alohida list+detail route'lar, ChatProfile doctor'da yo'q). `Chat/MessageBubble` + `api/chat.ts` qayta ishlatiladi. WebSocket+reconnect logikasi **shared `useChatSocket` hook**'ga ajratiladi (doctor `ChatsView`, patient detail uchinchi nusxa bo'lmasin) — doctor `ChatsView` ham shu hookka ko'chiriladi (refaktor, parite saqlanadi).
3. **VideoCall (3d):** real sahifa sifatida port qilinadi (`navigator.mediaDevices.getUserMedia` local kamera preview, timer, mute/video toggle, in-call local chat, invite-link modal). Remote peer yo'q (Vite'da ham yo'q — "Ожидание подключения..." placeholder). `react-router` `location.state` (`participant`, `appointmentId`) → `sessionStorage` handoff + URL `?room=`.
4. **Sessiya hajmi:** bu sessiyada: spec → foydalanuvchi review → plan → **faqat 3a** bajariladi → 3a gate'da to'xtaladi (foydalanuvchi smoke test). 3b-3d keyingi sessiyalarda (gate per sub-faza).

## 5. Port kerak bo'lgan yangi infra (gap items)

- **`api/search.ts`** — `useSearchDoctors`, `useSearchServices` (SearchResultsPage, 3b). Vite `frontend/src/api/search.ts`'dan port.
- **`Shared/EditProfileModal`** — `frontend-next/components/Shared/`'da hozir faqat `Toast.tsx` bor (3c, PatientProfilePage).
- **`useChatSocket` hook** — yangi shared hook, doctor `ChatsView`'ni ham unga ko'chirish (3d).
- **`api/profile.ts`** patient hooklari (`usePatientProfile`, `useAllDentists`, `useUpdatePatient`) **allaqachon mavjud** (doctor ishida shared sifatida port qilingan) — qo'shimcha kerak emas.
- `api/medcard.ts`, `api/appointments.ts`, `api/notifications.ts`, `api/services.ts`, `api/chat.ts`, `Chat/MessageBubble` — **allaqachon port qilingan**, qayta ishlatiladi.

## 6. Muvaffaqiyat mezoni (Success criteria)

Har sub-faza uchun:
- `npx tsc --noEmit` → exit 0
- `npm run build` → ✓, 0 yangi warning, kutilgan static/dynamic sahifalar generatsiya bo'ladi
- Patient sifatida login → har yangi route `PatientLayout` chrome ichida, mobil/desktop responsive, layout sinmaydi
- Vizual sodiqlik: Vite versiyasi bilan yonma-yon solishtirilganda farq yo'q (foydalanuvchi smoke test, gate)
- Push qilinmaydi (oldingi fazalar kabi local commit; foydalanuvchi xohlasa push)

Faza yakunida: progress log update, memory `frontend_next_migration.md` update.

## 7. Scope tashqarisi (Out of scope)

- Backend o'zgarishlari (FastAPI, JWT/localStorage, CORS — `localhost:3000` allaqachon allowed)
- Auth modeli o'zgarishi (localStorage'da qoladi, Phase 1 qarori)
- Vite `frontend/`'ni o'chirish yoki o'zgartirish (parallel qoladi)
- Real WebRTC peer connection (Vite'da ham yo'q)
- Yangi UX/vizual dizayn (faithful port, redesign emas)
- Netlify deploy konfiguratsiyasi (alohida ish)
- 3b-3d implementatsiyasi bu sessiyada (faqat 3a; qolgani gated)

## 8. Risklar va yumshatish

| Risk | Yumshatish |
|---|---|
| `useChatSocket` refaktori doctor `ChatsView` paritetini buzishi | 3d'da doctor `/chats` smoke test gate'ga kiritiladi; refaktor sof ekstraksiya (xulq o'zgarmaydi) |
| `location.state` → sessionStorage handoff race/stale | Handoff key appointment-specific; o'qilgach tozalanadi; fallback default participant (Vite'dagidek) |
| Patient route'lari doctor route'lari bilan path konflikti (`/notifications` vs `/patient/notifications`) | `lib/paths.ts` allaqachon ajratilgan (`patientNotifications: '/patient/notifications'`); `(patient)` route guruhi RoleGuard `requiredRole="patient"` |
| Yangi i18n kalit MISSING_MESSAGE crash | Yangi kalit avval `messages/ru.json`'ga; deep-merge fallback bor |
| Faithful port'da kutilmagan Vite bug ko'chirilishi | Maqsad paritet — Vite bug ham ko'chiriladi (regression emas); alohida topilsa user'ga xabar |
