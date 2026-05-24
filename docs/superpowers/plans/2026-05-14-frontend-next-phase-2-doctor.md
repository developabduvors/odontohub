# Frontend → Next.js Migration — Phase 2 Doctor Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Doctor (dentist) rolidagi foydalanuvchi uchun asosiy sahifalarni `frontend/` (Vite)'dan `frontend-next/` (Next.js 16)'ga ko'chirish — sidebar, hero, patient list, doctor profile, settings va appointments oqimini ishlatib bo'lish darajasiga olib chiqish.

**Architecture:** Har bir sahifa **Client Component** (`'use client'`), `'use client'` direktivasi pastki komponentlarga emas, faqat sahifa entrypoint'ga qo'yiladi (Next.js'da daraxt bo'ylab tarqaladi). API hooks `frontend/src/api/`'dan ko'chiriladi va `axios` instance `@/api/api.ts` ishlatadi. Routing `react-router-dom`'dan `next-intl`'ning `Link`/`usePathname`/`useRouter` wrapper'lariga (`@/i18n/navigation`) almashtiriladi. Imagelar `next/image` o'rniga `<img>` saqlanadi (Phase 3'da `next/image`'ga migratsiya — hozir avtomatik refaktor qilmaymiz, chunki `next/image` SSR talab qiladi va layout shift'larni qayta tekshirish kerak).

**Tech Stack:** Next.js 16 (App Router, Turbopack), TypeScript, Tailwind v4, Redux Toolkit, TanStack Query v5, next-intl v4, axios, lucide-react.

**Conventions:**
- Path alias: `@/*` → `./*` (root, hech qanday `~/*` yo'q)
- `react-router-dom` → `@/i18n/navigation` (`Link`, `useRouter`, `usePathname`)
- `react-i18next` `useTranslation()` → `next-intl` `useTranslations(namespace)` yoki `useLocale()`
- `import.meta.env.VITE_*` → `process.env.NEXT_PUBLIC_*`
- `assets/img/.../*.png` import → `/assets/img/.../*.png` (public/ dan absolute path)
- Joriy `frontend/`'da `toast.error/success/warning/info` ishlatilgan — `@/components/Shared/Toast` modulidan import qilinadi
- Hech qachon `frontend/` (Vite) ni o'zgartirmaymiz — faqat o'qiymiz va parallel saqlaymiz
- Plan'da Test-Driven Development qo'llanilmaydi: loyihada test runner yo'q (CLAUDE.md). Har bir task signal sifatida **`npm run build` muvaffaqiyatli bo'lishi** va sahifa **dev server'da render bo'lishini** ishlatadi.

**Phase 2 yakuniy yetkazib beriladigan natijalar:**
1. Toast komponenti port qilingan va root layout'da mount qilingan
2. Doctor sidebar (Doshboard) to'liq UI bilan port qilingan
3. DoctorPageShell port qilingan
4. `/menu` sahifasi to'liq UI bilan ishlaydi (Hero + 5 ta panel)
5. `/patients` sahifasi to'liq UI bilan ishlaydi (qidiruv + jadval + Add Patient modal)
6. `/profile` sahifasi to'liq UI bilan ishlaydi
7. (Bonus) `/profile/edit`, `/appointments`, `/settings` sahifalari — agar vaqt qolsa Phase 2b'ga qoldiriladi

**Scope cheklovi:** PatientDetailPage (`/patients/[id]`) Phase 2c'ga qoldiriladi — u 8+ sub-komponentga ega (Medcard, Allergy, Prescription, Payments, Notes, Photos, Appointments). Phase 2 yakuniy bo'lishi bilan alohida spec yoziladi.

---

## Task 1: Toast komponentni port qilish

**Files:**
- Create: `frontend-next/components/Shared/Toast.tsx`
- Modify: `frontend-next/app/[locale]/layout.tsx` (mount `<ToastContainer />`)

**Source:** `frontend/src/components/Shared/Toast.tsx` (153 satr) — modul darajasidagi state ishlatadi, React context yo'q. Mount nuqtasi `ToastContainer`.

- [ ] **Step 1: `components/Shared/` papkasini yaratish va Toast.tsx fayilini yozish**

Source file'ni o'qing: `frontend/src/components/Shared/Toast.tsx`. Yangi faylga **birinchi qatoriga `'use client';` qo'shing**, qolgan kod aynan ko'chiriladi.

Create `frontend-next/components/Shared/Toast.tsx`:

```tsx
'use client';

import { useEffect, useState } from "react";
import { AlertCircle, Info, X, ShieldCheck, AlertTriangle } from "lucide-react";

// ... (qolgan qism aynan frontend/src/components/Shared/Toast.tsx dan)
```

Asosiy o'zgarish: faqat fayl boshiga `'use client';` qo'shilishi. Qolgan kod 1:1.

- [ ] **Step 2: `ToastContainer`'ni `[locale]/layout.tsx`'ga mount qilish**

Modify `frontend-next/app/[locale]/layout.tsx`. Boshqa providerlar (`ReduxProvider`, `QueryProvider`, `NextIntlClientProvider`, `AuthInit`)'dan keyin, `{children}` bilan birgalikda `<ToastContainer />`'ni qo'shing:

```tsx
import { ToastContainer } from '@/components/Shared/Toast';

// ... existing imports

export default async function LocaleLayout({ children, params }: ...) {
  // ... existing provider tree
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ReduxProvider>
        <QueryProvider>
          <AuthInit />
          {children}
          <ToastContainer />
        </QueryProvider>
      </ReduxProvider>
    </NextIntlClientProvider>
  );
}
```

- [ ] **Step 3: Login va Register sahifalardagi `alert(...)` chaqiruvlarini `toast.error/success`'ga qaytarish**

Phase 1'da `toast` mavjud bo'lmagani uchun `alert(...)` ishlatilgan edi. Fayillar:
- `frontend-next/app/[locale]/(public)/login/page.tsx`
- `frontend-next/app/[locale]/(public)/register_pat/page.tsx`

Har birida:
```ts
// avval:
alert(errorMessage);
// keyin:
import { toast } from '@/components/Shared/Toast';
toast.error(errorMessage);
```

Va `alert('Success!')` o'rniga `toast.success('...')` — original text'larni `frontend/src/Pages/Login.tsx`/`Register1.tsx`'dan tekshiring.

- [ ] **Step 4: Build verify**

Run: `cd frontend-next; npm run build`
Expected: Build muvaffaqiyatli (24 static pages generatsiya bo'ladi, ogohlantirishlar bo'lishi mumkin — middleware/proxy haqida — lekin xato yo'q).

- [ ] **Step 5: Dev server'da Toast'ni sinash**

Run: `cd frontend-next; npm run dev`
Browser: `http://localhost:3000/ru/login` — noto'g'ri parol kiriting → Toast chiqishi kerak (eski `alert` o'rniga).

- [ ] **Step 6: Commit**

```powershell
git add frontend-next/components/Shared/Toast.tsx frontend-next/app/[locale]/layout.tsx frontend-next/app/[locale]/(public)/login/page.tsx frontend-next/app/[locale]/(public)/register_pat/page.tsx
git commit -m "feat(frontend-next): port Toast component + restore toast calls in Login/Register"
```

---

## Task 2: Shared API hooks port qilish (profile, appointments, notifications, services)

**Files:**
- Create: `frontend-next/api/profile.ts`
- Create: `frontend-next/api/appointments.ts`
- Create: `frontend-next/api/notifications.ts`
- Create: `frontend-next/api/services.ts`
- Create: `frontend-next/api/auth.ts`

**Source:** `frontend/src/api/{profile,appointments,notifications,services,auth}.ts`

Bular Phase 2'da bir nechta sahifada ishlatiladi (Doshboard, Render, Patsant, DoctorProfile, Appointments). Phase 1'da faqat `api/api.ts` (axios instance) ko'chirilgan edi.

- [ ] **Step 1: `frontend-next/api/profile.ts` yaratish**

Source: `frontend/src/api/profile.ts` (274 satr). Hammasini ko'chiring, **import yo'llarini mosalashtirish**:

```ts
// avval (Vite):
import api from './api';
// keyin (Next.js — bir xil joyda turibdi, lekin frontend-next/api/ ichida):
import api from './api';  // aynan o'zi, alias kerak emas
```

Tekshiring: `frontend-next/api/api.ts` mavjudligini. `useQuery`, `useMutation` chaqiruvlari React Query v5 — `frontend-next/providers/QueryProvider.tsx`'da allaqachon mavjud.

- [ ] **Step 2: `frontend-next/api/appointments.ts` yaratish**

Source: `frontend/src/api/appointments.ts`. Aynan ko'chiring.

- [ ] **Step 3: `frontend-next/api/notifications.ts` yaratish**

Source: `frontend/src/api/notifications.ts`. Aynan ko'chiring.

- [ ] **Step 4: `frontend-next/api/services.ts` yaratish**

Source: `frontend/src/api/services.ts`. Aynan ko'chiring.

- [ ] **Step 5: `frontend-next/api/auth.ts` yaratish**

Source: `frontend/src/api/auth.ts`. Aynan ko'chiring. (Phase 1'da Login/Register `api/api.ts` orqali `axios.post('/auth/login')` to'g'ridan-to'g'ri chaqirgan edi — `auth.ts` hozircha ishlatilmasligi mumkin, lekin DoctorProfile'da `/auth/me` chaqiruvi uchun kerak bo'ladi.)

- [ ] **Step 6: Build verify**

Run: `cd frontend-next; npm run build`
Expected: Build muvaffaqiyatli. Tip: hech qaysi yangi fayl import qilinmaganligi sababli, ular tree-shake bo'ladi — build hajmi o'zgarmasligi kerak.

- [ ] **Step 7: Commit**

```powershell
git add frontend-next/api/
git commit -m "feat(frontend-next): port API hook modules (profile, appointments, notifications, services, auth)"
```

---

## Task 3: Doctor sidebar (Doshboard) port qilish

**Files:**
- Create: `frontend-next/layouts/Doshboard.tsx`
- Modify: `frontend-next/layouts/MainLayout.tsx` (stub'ni almashtirish)
- Modify: `frontend-next/lib/paths.ts` (kerak bo'lsa `analytics`, `chats`, `notifications` kalitlarini qo'shish)

**Source:** `frontend/src/Layouts/Doshboard.tsx` (163 satr) — mobil drawer + desktop sticky sidebar, badge bilan notifications, fokus paneli.

- [ ] **Step 1: `frontend-next/lib/paths.ts`'da kerakli kalitlarni tekshirish**

Read: `frontend-next/lib/paths.ts`. Kalitlar mavjud bo'lishi kerak: `menu`, `patient`, `appointments`, `chats`, `notifications`, `analytics`, `profile`, `settings`. Yo'q bo'lganlarni qo'shing:

```ts
export const paths = {
  // ... mavjudlar
  analytics: '/analytics',
  chats: '/chats',
  notifications: '/notifications',
  settings: '/settings',
} as const;
```

- [ ] **Step 2: `frontend-next/layouts/Doshboard.tsx` yaratish**

Source: `frontend/src/Layouts/Doshboard.tsx`. Quyidagi 5 ta o'zgartirish bilan ko'chiring:

1. **Fayl boshiga `'use client';` qo'shing**.
2. `import { Link, useLocation } from "react-router-dom"` → `import { Link, usePathname } from '@/i18n/navigation'`. `useLocation().pathname` → `usePathname()`.
3. `import { useTranslation } from "react-i18next"` → `import { useTranslations } from 'next-intl'`. `const { t } = useTranslation()` → `const t = useTranslations()`. Chaqiruvlar: `t('sidebar.dashboard')` → `t('sidebar.dashboard')` (kalit nuqtaviy notatsiyada bir xil).
4. `import GoSmileLogo from "../assets/img/icons/logo1.png"` → `<img src="/assets/img/icons/logo1.png" alt="GoSmile" />` (public'dan absolute path).
5. `import { paths } from "../Routes/path"` → `import { paths } from '@/lib/paths'`.

Plural kalitlari (`focus_appointment_single`/`focus_appointments_plural`, `focus_new_patient_single`/`focus_new_patients_plural`) Phase 1'da `messages/{uz,ru,en,kz}.json`'da mavjudligini tekshiring (`grep "focus_appointment" frontend-next/messages/*.json`). Yo'q bo'lsa Phase 1'da `{{var}}`→`{var}` konvertatsiyasi paytida tushib qolgan — `frontend/src/translations/`'dan qo'shing.

- [ ] **Step 3: `frontend-next/layouts/MainLayout.tsx`'ni Doshboard ishlatadigan qilib yangilash**

Current stub'ni almashtiring:

```tsx
'use client';

import type { ReactNode } from 'react';
import Doshboard from './Doshboard';

export function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell flex min-h-screen text-gray-900">
      <Doshboard />
      <main className="flex-1 min-w-0 overflow-x-clip pt-20 lg:pt-0">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 4: `app/[locale]/(doctor)/layout.tsx`'ni tekshirish**

Read: `frontend-next/app/[locale]/(doctor)/layout.tsx`. U `<MainLayout>{children}</MainLayout>` o'rashi kerak. Agar bunday emas bo'lsa, RoleGuard ichida MainLayout'ni qo'shing.

- [ ] **Step 5: Build + dev verify**

Run: `cd frontend-next; npm run build`
Expected: Muvaffaqiyatli.

Run: `cd frontend-next; npm run dev`
Browser: `http://localhost:3000/ru/menu` (avval dentist bilan login qiling). Sidebar to'liq UI bilan ko'rinishi kerak. Mobile (devtools'da 375px) — burger menyu + drawer ishlashi kerak.

- [ ] **Step 6: Commit**

```powershell
git add frontend-next/layouts/Doshboard.tsx frontend-next/layouts/MainLayout.tsx frontend-next/lib/paths.ts frontend-next/messages/
git commit -m "feat(frontend-next): port Doshboard sidebar with mobile drawer + focus panel"
```

---

## Task 4: DoctorPageShell komponentini port qilish

**Files:**
- Create: `frontend-next/components/Layout/DoctorPageShell.tsx`

**Source:** `frontend/src/components/Layout/DoctorPageShell.tsx` (74 satr) — visual chrome (badge + title + accent + description + content). Sof static UI, hech qanday hook'lar yo'q.

- [ ] **Step 1: `frontend-next/components/Layout/` papkasini yaratish va `DoctorPageShell.tsx` ko'chirish**

Source'ni aynan ko'chiring. **`'use client'` SHART EMAS** — bu komponent faqat props'ni renderlaydi, hech qanday client-only API ishlatmaydi. Lekin ko'pchilik sahifa Client Component bo'lgani uchun farq sezilarli emas.

- [ ] **Step 2: Build verify**

Run: `cd frontend-next; npm run build`
Expected: Build muvaffaqiyatli. Hozircha hech kim DoctorPageShell'ni import qilmagani uchun tree-shake bo'ladi.

- [ ] **Step 3: Commit**

```powershell
git add frontend-next/components/Layout/
git commit -m "feat(frontend-next): port DoctorPageShell visual chrome"
```

---

## Task 5: `/menu` (Render) sahifasini port qilish

**Files:**
- Modify: `frontend-next/app/[locale]/(doctor)/menu/page.tsx` (stub'ni almashtirish)
- Create: `frontend-next/components/Bosh sahifa/Hero.tsx`
- Create: `frontend-next/components/Bosh sahifa/NewPatients.tsx`
- Create: `frontend-next/components/Bosh sahifa/Analytics.tsx`
- Create: `frontend-next/components/Bosh sahifa/PatientSearch.tsx`
- Create: `frontend-next/components/Bosh sahifa/Tezroq.tsx`
- Create: `frontend-next/components/Bosh sahifa/Section.tsx`

**Source:**
- `frontend/src/Pages/Menu.tsx` → `DoctorPageShell` wrapper + Render
- `frontend/src/Pages/Render.tsx` (41 satr) → 6-panel grid layout
- `frontend/src/components/Bosh sahifa/{Hero,NewPatients,Analytics,PatientSearch,Tezroq,Section}.tsx`

Eslatma: papkada uzbek tilidagi "Bosh sahifa" (= "Home page") nomi bor. Saqlang.

- [ ] **Step 1: 6 ta sub-komponentni ko'chirish**

Har biri uchun:
1. Source'ni o'qing (`frontend/src/components/Bosh sahifa/<Name>.tsx`)
2. Targetga yozing (`frontend-next/components/Bosh sahifa/<Name>.tsx`)
3. **`'use client';` qo'shing fayl boshiga** (har birida useState/useEffect/hooks bor)
4. **Import migratsiyasi**:
   - `react-router-dom` `Link/useNavigate` → `@/i18n/navigation` `Link/useRouter`
   - `useTranslation` → `useTranslations` (next-intl)
   - `../assets/img/...` PNG/SVG → `/assets/img/...` (`<img src>`) yoki `import img from '...'` o'rniga absolute path
   - `../api/...` → `@/api/...`
   - `../Routes/path` → `@/lib/paths`
   - `../components/Shared/Toast` → `@/components/Shared/Toast`
5. **Image importlari**: agar `import X from '../../assets/img/...'` bo'lsa, faqat `'/assets/img/...'` string'ga aylantiring.

- [ ] **Step 2: Menu/Render sahifasini port qilish — birlashtirilgan page.tsx**

Joriy `frontend-next/app/[locale]/(doctor)/menu/page.tsx` stub'ni quyidagi bilan almashtiring:

```tsx
'use client';

import { useState } from 'react';
import DoctorPageShell from '@/components/Layout/DoctorPageShell';
import Hero from '@/components/Bosh sahifa/Hero';
import NewPatients from '@/components/Bosh sahifa/NewPatients';
import Analytics from '@/components/Bosh sahifa/Analytics';
import PatientSearch from '@/components/Bosh sahifa/PatientSearch';
import Tezroq from '@/components/Bosh sahifa/Tezroq';
import Section from '@/components/Bosh sahifa/Section';

export default function MenuPage() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DoctorPageShell
      badge="Dashboard"
      title="GoSmile"
      accent="Рабочее пространство"
      description="Главный экран врача с быстрым доступом к пациентам, аналитике, уведомлениям и ежедневным задачам."
      contentClassName="p-0"
    >
      <div>
        <Hero onSearch={setSearchQuery} />
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
            <div className="xl:col-span-8 flex flex-col space-y-4 sm:space-y-6 min-w-0">
              <Analytics />
              <NewPatients />
              <PatientSearch searchQuery={searchQuery} />
              <Tezroq />
            </div>
            <div className="xl:col-span-4 min-w-0">
              <Section />
            </div>
          </div>
        </div>
      </div>
    </DoctorPageShell>
  );
}
```

Eslatma: Joriy `frontend`'da `Menu.tsx` `Render`'ni alohida fayl sifatida import qiladi. Bu yerda birlashtirildi, chunki Render boshqa joyda ishlatilmaydi.

- [ ] **Step 3: Path alias bilan papka nomidagi probel masalasi**

`@/components/Bosh sahifa/Hero` import yo'li probel bilan — TypeScript/Webpack buni qabul qiladi, lekin ehtiyot bo'ling. Agar build muammo bersa, papkani `Bosh%20sahifa` yoki encoded path bilan urinib ko'ring, yoki **last resort**: papka nomini `BoshSahifa` ga rename qiling (lekin avval Phase 1 fayllarini grepda tekshirib chiqing — `frontend/src` papka nomi nimaga bog'liq).

- [ ] **Step 4: Build verify**

Run: `cd frontend-next; npm run build`
Expected: Muvaffaqiyatli.

- [ ] **Step 5: Dev verify**

Run: `cd frontend-next; npm run dev`
Backend ham ishlasin: `cd backend; python run.py`.
Browser: dentist bilan login → `/ru/menu` — Hero + 5 ta panel ko'rinishi kerak.

Backend ishlamasa, Analytics/NewPatients API'siz bo'sh state'da ko'rinadi — bu OK, faqat layout shift bo'lmasligi kerak.

- [ ] **Step 6: Commit**

```powershell
git add "frontend-next/components/Bosh sahifa/" frontend-next/app/[locale]/(doctor)/menu/page.tsx
git commit -m "feat(frontend-next): port /menu page (Hero + Analytics + NewPatients + PatientSearch + Tezroq + Section)"
```

---

## Task 6: `/patients` (Patsant) sahifasini port qilish

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/patients/page.tsx`
- Create: `frontend-next/components/Bosh sahifa/Qidiruv.tsx` (agar Task 5'da kerak bo'lmagan bo'lsa)
- Create: `frontend-next/components/Bosh sahifa/PatsentTable.tsx` (agar Task 5'da kerak bo'lmagan bo'lsa)
- Create: `frontend-next/data/patients.ts` (`Patient` type)

**Source:**
- `frontend/src/Pages/Patsant.tsx` (153 satr)
- `frontend/src/components/Bosh sahifa/Qidiruv.tsx` (153 satr) — search + filter + Add modal
- `frontend/src/components/Bosh sahifa/PatsentTable.tsx` (136 satr)
- `frontend/src/data/patients.ts` (Patient interface)

- [ ] **Step 1: `frontend-next/data/patients.ts` yaratish**

Source: `frontend/src/data/patients.ts`. Aynan ko'chiring (type definition + balki demo data — demo data zarur bo'lmasa olib tashlang).

- [ ] **Step 2: `Qidiruv.tsx` va `PatsentTable.tsx` ko'chirish**

Task 5'dagi qoidalar bilan ko'chiring (`'use client'`, import migratsiyasi). Diqqat:
- `Qidiruv` ichida `react-hook-form` ishlatadi va Add Patient modal'ni o'z ichiga oladi → fayl boshiga `'use client';` shart.
- `PatsentTable` `react-router-dom` `useNavigate` ishlatadi → `useRouter()` from `@/i18n/navigation`.

- [ ] **Step 3: `app/[locale]/(doctor)/patients/page.tsx` yaratish**

Source: `frontend/src/Pages/Patsant.tsx`. Ko'chirish qoidalari:
- Fayl boshiga `'use client';`
- `useNavigate` → `useRouter` from `@/i18n/navigation`; `navigate(paths.menu)` → `router.push(paths.menu)`
- `useTranslation` → `useTranslations` (chaqirilgan kalitlar `patients_list.new_patient_added` — `messages/*.json` da mavjudligini tekshiring)
- `Rasm` import (Subtract.png) → `'/assets/img/photos/Subtract.png'` string
- Toast import → `@/components/Shared/Toast`
- API import → `@/api/profile`
- paths → `@/lib/paths`

- [ ] **Step 4: Build verify**

Run: `cd frontend-next; npm run build`
Expected: Muvaffaqiyatli, yangi `/patients` route 24 → 28 ta sahifa generatsiya bo'ladi (4 locale × 7 route).

- [ ] **Step 5: Dev verify**

Browser: dentist login → `/ru/patients` — qidiruv + jadval ko'rinishi. "Add Patient" tugmasi modal ochishi va POST yuborishi kerak. Toast chiqishi kerak.

- [ ] **Step 6: Commit**

```powershell
git add frontend-next/app/[locale]/(doctor)/patients/ "frontend-next/components/Bosh sahifa/Qidiruv.tsx" "frontend-next/components/Bosh sahifa/PatsentTable.tsx" frontend-next/data/
git commit -m "feat(frontend-next): port /patients page with search, filter, and add modal"
```

---

## Task 7: `/profile` (DoctorProfile) sahifasini port qilish

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/profile/page.tsx`
- Create: `frontend-next/components/DoctorProfile/*.tsx` (PageHeader, StatsSection, ContactInfoCard, ScheduleCard, SocialNetworksCard, WorksSection, ServicesSection — 7 sub-komponent)

**Source:**
- `frontend/src/Pages/DoctorProfile.tsx` (174 satr)
- `frontend/src/components/DoctorProfile/*.tsx`

- [ ] **Step 1: Source DoctorProfile.tsx'ni o'qib, qaysi sub-komponentlarni ishlatishini aniqlang**

Read: `frontend/src/Pages/DoctorProfile.tsx`. Importlar ro'yxatini olib, qaysi `components/DoctorProfile/*` kerakligini aniqlang.

- [ ] **Step 2: Har bir sub-komponentni ko'chirish (Task 5 qoidalari bilan)**

Har biri uchun:
- `'use client'` qo'shing (agar hook ishlatsa)
- Import migratsiyasi (Link, useRouter, useTranslations, images, paths, api, Toast)

- [ ] **Step 3: `app/[locale]/(doctor)/profile/page.tsx` yaratish**

Source: `frontend/src/Pages/DoctorProfile.tsx`. Ko'chirish qoidalari Task 6 bilan bir xil.

- [ ] **Step 4: Build + dev verify**

Run: `cd frontend-next; npm run build` (muvaffaqiyatli).
Browser: dentist login → `/ru/profile` — to'liq profile ko'rinishi kerak: hero + stats + services + works + schedule + contact + social.

- [ ] **Step 5: Commit**

```powershell
git add frontend-next/app/[locale]/(doctor)/profile/ frontend-next/components/DoctorProfile/
git commit -m "feat(frontend-next): port /profile (DoctorProfile) page with all subsections"
```

---

## Task 8: `/profile/edit` (EditDoctorProfile) sahifasini port qilish [BONUS]

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/profile/edit/page.tsx`

**Source:** `frontend/src/Pages/EditDoctorProfile.tsx` (538 satr — eng katta forma)

- [ ] **Step 1: Source'ni o'qing va sub-komponent bog'liqliklarni aniqlang**

Read va grep: `import.*from '\.\./components`. Qaysi yangi sub-komponentlar kerak — Task 5 qoidalari bilan ko'chiring.

- [ ] **Step 2: Page'ni ko'chirish**

`react-hook-form` allaqachon `package.json`'da bor (Phase 1'da Register form'da ishlatilgan). 538 satr forma — har bir field handlerni 1:1 ko'chiring.

Maxsus diqqat:
- `file upload` (`<input type="file" />`) → Next.js'da xuddi shunday ishlaydi
- `axios.post('/multipart/form-data')` → o'zgarmaydi
- `useNavigate` → `useRouter` from `@/i18n/navigation`

- [ ] **Step 3: Build + dev verify**

Run: `cd frontend-next; npm run build`. Browser: profile → "Edit" → forma to'ldirish → submit → muvaffaqiyatli yangilanish.

- [ ] **Step 4: Commit**

```powershell
git add frontend-next/app/[locale]/(doctor)/profile/edit/
git commit -m "feat(frontend-next): port /profile/edit (EditDoctorProfile) form"
```

---

## Task 9: `/appointments` sahifasini port qilish [BONUS]

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/appointments/page.tsx`
- Create: `frontend-next/components/Appointments/*.tsx` (DateStrip, RescheduleModal, AppointmentModal, CalendarView)

**Source:**
- `frontend/src/Pages/Appointments.tsx` (224 satr)
- `frontend/src/components/Appointments/{DateStrip,RescheduleModal,AppointmentModal,CalendarView}.tsx`

- [ ] **Step 1: Sub-komponentlarni ko'chirish** (Task 5 qoidalari)
- [ ] **Step 2: Page'ni ko'chirish** (Task 6 qoidalari)
- [ ] **Step 3: Build + dev verify**

Browser: dentist login → `/ru/appointments` — kalendar ko'rinishi, sana strip, modal'lar.

- [ ] **Step 4: Commit**

```powershell
git add frontend-next/app/[locale]/(doctor)/appointments/ frontend-next/components/Appointments/
git commit -m "feat(frontend-next): port /appointments page with calendar view and reschedule modal"
```

---

## Task 10: `/settings` sahifasini port qilish [BONUS]

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/settings/page.tsx`
- Create: `frontend-next/components/Settings/NotificationSettings.tsx`
- Create: `frontend-next/components/Settings/Support.tsx`

**Source:**
- `frontend/src/Pages/Settings.tsx` (71 satr — kichik)
- `frontend/src/components/Settings/{NotificationSettings,Support}.tsx`

- [ ] **Step 1: Sub-komponentlarni ko'chirish**
- [ ] **Step 2: Page'ni ko'chirish**
- [ ] **Step 3: Build + dev verify**

Browser: `/ru/settings` — sozlamalar paneli ko'rinishi.

- [ ] **Step 4: Commit**

```powershell
git add frontend-next/app/[locale]/(doctor)/settings/ frontend-next/components/Settings/
git commit -m "feat(frontend-next): port /settings page with notifications and support"
```

---

## Task 11: Phase 2 yakuniy build + progress log

**Files:**
- Modify: `docs/superpowers/plans/2026-05-14-frontend-next-progress.md` (Phase 2 natijalarini qo'shish)

- [ ] **Step 1: To'liq build verify**

Run: `cd frontend-next; npm run build`
Expected: Build muvaffaqiyatli. Static sahifalar soni hisoblang: 4 locale × (Phase 1: 6 sahifa + Phase 2: qancha port qilingan).

- [ ] **Step 2: Manual smoke test routes**

Backend ishlasin, dentist login bilan:
1. `/ru/menu` — Hero + paneller
2. `/ru/patients` — qidiruv + jadval + Add Patient
3. `/ru/profile` — to'liq profile
4. (agar port qilingan) `/ru/profile/edit`, `/ru/appointments`, `/ru/settings`

Har birida sidebar ko'rinishi, mobile drawer ishlashi, locale switcher (uz/ru/en/kz) ishlashi.

- [ ] **Step 3: `2026-05-14-frontend-next-progress.md`'ga Phase 2 bo'limini qo'shish**

Mavjud progress log'ga "Phase 2 (Doctor)" sarlavhasi bilan yangi bo'lim. Tarkibi:
- Bajarilgan ish: qaysi sahifalar port qilingan, commit hash'lar
- Yangi struktura: papkalar va fayllar
- Hali qolgan: PatientDetailPage va Phase 3 (Chat, Patient flow)

- [ ] **Step 4: Memory file'ni yangilash**

`C:\Users\admin\.claude\projects\C--Users-admin-Desktop-GoFamily-OdontoHub\memory\frontend_next_migration.md`'ni yangilang: Phase 2 yakunlandi, qaysi sahifalar ko'chirildi, Phase 3 nima.

- [ ] **Step 5: Final commit**

```powershell
git add docs/superpowers/plans/2026-05-14-frontend-next-progress.md
git commit -m "docs: log Phase 2 Doctor migration completion"
```

---

## Asosiy migratsiya qoidalari (xulosa)

| Vite (joriy) | Next.js 16 (yangi) |
|---|---|
| `import { Link, useNavigate } from 'react-router-dom'` | `import { Link, useRouter } from '@/i18n/navigation'` |
| `useLocation().pathname` | `usePathname()` from `@/i18n/navigation` |
| `useNavigate(); navigate('/foo')` | `useRouter().push('/foo')` |
| `import { useTranslation } from 'react-i18next'; const { t } = useTranslation()` | `import { useTranslations } from 'next-intl'; const t = useTranslations()` |
| `import img from '../assets/img/foo.png'` | `'/assets/img/foo.png'` (string) |
| `import.meta.env.VITE_API_URL` | `process.env.NEXT_PUBLIC_API_URL` |
| `import api from '../api/api'` | `import api from '@/api/api'` |
| `import { paths } from '../Routes/path'` | `import { paths } from '@/lib/paths'` |
| `import { toast } from '../components/Shared/Toast'` | `import { toast } from '@/components/Shared/Toast'` |
| (yo'q) | `'use client';` har bir page va hook ishlatadigan komponent boshida |
| `{{var}}` translation kalitlari | `{var}` ICU formatida |

## Eslatmalar (juda muhim)

- **Hech qachon `frontend/`'ni o'zgartirmang** — faqat read-only manba sifatida ishlating.
- **Har bir sub-komponent papkasini yaratishdan oldin**, tekshiring: o'sha papka allaqachon mavjud emasligini (`Bosh sahifa` papkasi Task 5'da yaratilsa, Task 6'da qo'shimcha fayllar uchun qayta yaratish shart emas).
- **Toast** Task 1'da qo'shilgani uchun keyingi task'lar uni ishonchli import qilishi mumkin.
- **next-intl `messages/` fayllariga yetishmagan kalit**larni qo'shganda, 4 ta tilning hammasiga qo'shing (uz, ru, en, kz).
- **Build vaqtida warning** — `middleware` → `proxy` deprecation. Hozircha next-intl `proxy`'ga moslashmagan, ogohlantirish qoldiriladi. **Xato emas**.
- **Path alias muammosi**: papka nomida probel (`Bosh sahifa`) — TypeScript va Webpack ishlatadi, lekin agar ish bermasa, papkani `BoshSahifa` ga rename qiling va import yo'llarini yangilang.
- **Vaqt budjeti**: Task 1-7 (Toast + API + Layout + 3 sahifa) — taxminan 3-5 soat. Task 8-11 (qolgan 3 sahifa + yakunlash) — yana 2-3 soat. Birinchi sessiyada 1-7'ni bajarish realistic, 8-11 keyingi sessiya/Phase 2b'ga qoldirish mumkin.

## Phase 3 uchun e'tibor

- Patient flow (Variant B): 6 sahifa + PatientLayout polish
- PatientDetailPage (`/patients/[id]`): 8+ sub-komponent — alohida spec talab qiladi
- Chat (Variant C): WebSocket integration — alohida spec
