# Frontend → Next.js Migration — Phase 3 (Patient Flow) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Port the Vite patient flow (19 routes + `PatientLayout`/`PatientNavbar` chrome) into `frontend-next/` with 1:1 visual fidelity, in 4 user-gated sub-phases. This document fully details **sub-phase 3a (Foundation)** — the only part executed this session — and gives a structured roadmap for 3b–3d (each gets its own detailed plan file at its gate, matching the project's per-chunk plan-file history: phase-2c, phase-2d, chats-websocket).

**Architecture:** Faithful Vite→Next port using the validated doctor-flow pattern. Each Vite page is a thin wrapper composing `components/<Feature>/` parts; porting work is per component. 3a establishes the patient chrome (`PatientLayout` + `PatientNavbar`) that every other patient route renders inside, then the real `/home`.

**Tech Stack:** Next.js 16 App Router, React 19, next-intl v4 (`useTranslations` full dotted keys, `@/i18n/navigation`), Redux Toolkit, React Query (`@/api/*` hooks), Tailwind v4, lucide-react. SSR-safe localStorage access. Hardcoded RU/UZ strings stay as in Vite.

**Spec:** `docs/superpowers/specs/2026-05-16-frontend-next-phase-3-patient-design.md`

**Testing note:** This repo has **no test runner** (root `CLAUDE.md`, `frontend-next/AGENTS.md`). User instruction overrides the TDD default. Verification per task is `cd frontend-next && npx tsc --noEmit` (exit 0). The 3a gate task adds `npm run build` (exit 0, expected static-page delta) + a manual smoke test with the backend running. Do **not** add a test framework.

**Pre-flight (verified true on branch `patient/abduvoris`, no change needed):**
- `frontend-next/api/notifications.ts` exports `getUnreadCount(): Promise<number>`.
- `frontend-next/api/appointments.ts` exports `useMyAppointments`.
- `frontend-next/api/profile.ts` exports `useAllDentists`.
- `frontend-next/types/patient.ts` exports `Service { icon: string; label: string }` and `QuickAction { label: string; icon: string; color: string; path: string }`.
- `frontend-next/messages/ru.json` has `patient.home.{greeting (ICU "Привет, {name}"),greeting_subtitle,search,upcoming,services,services_all,services_treatment,services_hygiene,services_surgery,action_book,action_doctors,action_my_dentist,more_details}`, `patient.navbar.{home,appointments,chats,history,profile}`, `patient_profile.tabs.medcard`, `analytics.filter.all`, `patient.appointments.{type_extraction,specialty_general}`. **`patient.home.suggested_doctors` / `see_all` do NOT exist in any locale — in Vite they always fell back to the literal Uzbek `"Sizga yaqin shifokorlar"` / `"Barchasi"`; the port hardcodes those two literals (faithful — identical rendered output, no ru.json change).**
- Assets present in `frontend-next/public/assets/img/`: `icons/logo-icon1.png`, `icons/image 4 (1).svg`, `icons/image 4.svg`, `icons/image 4 (2).svg`, `icons/image 4 (3).svg`, `icons/Scroll Up.svg`, `icons/healthicons_doctor-male.svg`, `icons/Consultation.svg`, `photos/Dentist.png`.
- `frontend-next/app/globals.css` defines `.app-shell`, `.app-panel`, `.font-railway`, `--font-railway`.
- `tsconfig.json` has no `noUnusedLocals`.
- Established port pattern (from `layouts/Doshboard.tsx`): `'use client'`; `import { useTranslations } from "next-intl"; const t = useTranslations();` then full dotted `t("a.b.c")`; `import { Link, usePathname, useRouter } from "@/i18n/navigation";`; `<img>` preceded by `{/* eslint-disable-next-line @next/next/no-img-element */}`.
- `frontend-next/app/[locale]/(patient)/layout.tsx` imports the **named** export `{ PatientLayout }` from `@/layouts/PatientLayout` and wraps it in `<RoleGuard requiredRole="patient">`. Keep the named export signature `export function PatientLayout({ children }: { children: ReactNode })`.
- Vite `components/Bosh sahifa/` folder is mirrored in `frontend-next/components/Bosh sahifa/` (doctor parts already there) — `PatientNavbar` ports there for folder parity.

**Handoff contract (defined here, consumed in 3b):** Vite uses `react-router` `navigate(path, { state })`. Next App Router has no router state, so 3a writes `sessionStorage` then navigates; the 3b Booking/Doctors pages read+clear these keys:
- `gosmile:booking_doctor` → JSON of the doctor object (set by `SuggestedDoctors`, read by `/booking`).
- `gosmile:doctors_specialty` → specialty string (set by `ServicesGrid`, read by `/doctors`).
Until 3b ships those routes, clicking these 404s — **expected** for a gated foundation; the 3a gate verifies `/home` renders, not that forward links resolve.

---

## SUB-PHASE 3a — Foundation (this session; gate 1)

### Task 1: Port `PatientNavbar` (patient chrome nav)

**Files:**
- Create: `frontend-next/components/Bosh sahifa/PatientNavbar.tsx`

Port of Vite `frontend/src/components/Bosh sahifa/PatientNavbar.tsx`. Transformations: `'use client'`; `useLocation`/`useNavigate` → `usePathname`/`useRouter` from `@/i18n/navigation`; `useTranslation`→`useTranslations` (`const t = useTranslations()`); `import GoSmileLogo from '...png'` → string path `/assets/img/icons/logo-icon1.png` via `<img>` + eslint-disable; relative `../../api/notifications` → `@/api/notifications`; `../../Routes/path` → `@/lib/paths`. `usePathname()` from `@/i18n/navigation` returns the path **without** the locale prefix, so it compares directly to `paths.*` (same as Vite `location.pathname`). The hardcoded `"Bildirishnomalar"` label stays.

- [ ] **Step 1: Create `frontend-next/components/Bosh sahifa/PatientNavbar.tsx`**

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Calendar, FileText, Home, MessageSquare, User } from 'lucide-react';

import { usePathname, useRouter } from '@/i18n/navigation';
import { getUnreadCount } from '@/api/notifications';
import { paths } from '@/lib/paths';

export default function PatientNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    getUnreadCount().then(setUnread).catch(() => {});
    const interval = setInterval(() => {
      getUnreadCount().then(setUnread).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { icon: <Home size={24} />, path: paths.patientHome, label: t('patient.navbar.home') },
    { icon: <Calendar size={24} />, path: paths.patientCalendar, label: t('patient.navbar.appointments') },
    { icon: <MessageSquare size={24} />, path: paths.patientChats, label: t('patient.navbar.chats') },
    { icon: <FileText size={24} />, path: paths.patientHistory, label: t('patient_profile.tabs.medcard') },
    { icon: <User size={24} />, path: paths.patientProfileSettings, label: t('patient.navbar.profile') },
    {
      icon: (
        <div className="relative">
          <Bell size={24} />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </div>
      ),
      path: paths.patientNotifications,
      label: 'Bildirishnomalar',
    },
  ];

  return (
    <>
      <nav className="app-panel fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around rounded-[28px] border border-white/60 px-4 py-2 sm:hidden">
        {navItems.map((item, index) => {
          const isActive = pathname === item.path;
          return (
            <button
              key={index}
              onClick={() => router.push(item.path)}
              className={`font-railway flex flex-col items-center gap-1 transition-colors ${
                isActive ? 'text-[#5667ff]' : 'text-[#7f8ab4]'
              }`}
            >
              <div className={`rounded-xl p-2 transition-all ${isActive ? 'bg-[#eef1ff] text-[#5667ff]' : ''}`}>
                {item.icon}
              </div>
              {isActive && <span className="text-[10px] font-semibold">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <aside className="fixed left-0 top-0 bottom-0 z-50 hidden bg-transparent p-4 sm:flex sm:w-24 lg:w-72">
        <div className="app-panel flex h-full w-full flex-col rounded-[32px] border border-white/70 py-8">
          <div className="mb-10 hidden px-6 lg:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/icons/logo-icon1.png" alt="GoSmile" />
          </div>
          <div className="flex justify-center mb-10 lg:hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/img/icons/logo-icon1.png" alt="GoSmile" className="h-11 w-11 object-contain" />
          </div>
          <div className="space-y-4 px-4 lg:px-6">
            {navItems.map((item, index) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={index}
                  onClick={() => router.push(item.path)}
                  className={`group flex w-full items-center gap-4 rounded-2xl p-3 transition-all duration-300 lg:px-4 ${
                    isActive
                      ? 'bg-[linear-gradient(135deg,#6679ff_0%,#5667ff_100%)] text-white shadow-[0_16px_34px_rgba(86,103,255,0.28)]'
                      : 'text-[#7280aa] hover:bg-white/70'
                  }`}
                >
                  <div className={isActive ? 'text-white' : 'transition-colors group-hover:text-[#5667ff]'}>
                    {item.icon}
                  </div>
                  <span className="hidden font-railway text-sm font-bold lg:block lg:text-base">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>
    </>
  );
}
```

- [ ] **Step 2: Type-check** — Run: `cd frontend-next && npx tsc --noEmit` — Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add "frontend-next/components/Bosh sahifa/PatientNavbar.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): port PatientNavbar (bottom nav + desktop sidebar)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Replace `PatientLayout` with full chrome

**Files:**
- Modify: `frontend-next/layouts/PatientLayout.tsx` (full replace; keep the named export `PatientLayout`)

The current file is a Phase-1 minimal stub (its own bottom nav + logout). Replace it with the Vite `Layouts/PatientLayout.tsx` chrome (`app-shell` wrapper + `PatientNavbar` + a `<main>` content slot). Vite uses `<Outlet/>`; Next uses the `children` prop (already passed by `(patient)/layout.tsx`). The named export signature is unchanged so `(patient)/layout.tsx` needs no edit.

- [ ] **Step 1: Replace `frontend-next/layouts/PatientLayout.tsx` entirely**

```tsx
'use client';

import type { ReactNode } from 'react';
import PatientNavbar from '@/components/Bosh sahifa/PatientNavbar';

export function PatientLayout({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell min-h-screen pb-24 sm:pb-0 sm:pl-24 lg:pl-72">
      <PatientNavbar />
      <main className="relative mx-auto min-h-screen max-w-7xl p-4 md:p-8 lg:p-10">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — Run: `cd frontend-next && npx tsc --noEmit` — Expected: exit 0, no output. (`(patient)/layout.tsx` still imports `{ PatientLayout }` — signature unchanged.)

- [ ] **Step 3: Commit**

```bash
git add frontend-next/layouts/PatientLayout.tsx
git -c commit.gpgsign=false commit -m "feat(frontend-next): full PatientLayout chrome (app-shell + PatientNavbar)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Port the 5 `PatientHome` sub-components

**Files:**
- Create: `frontend-next/components/PatientHome/SearchBar.tsx`
- Create: `frontend-next/components/PatientHome/UpcomingAppointment.tsx`
- Create: `frontend-next/components/PatientHome/SuggestedDoctors.tsx`
- Create: `frontend-next/components/PatientHome/ServicesGrid.tsx`
- Create: `frontend-next/components/PatientHome/QuickActionsGrid.tsx`

Shared transformations: `'use client'`; `useNavigate`/`Link` (react-router) → `useRouter`/`Link` from `@/i18n/navigation`; `useTranslation`→`useTranslations`; relative `../../api|types` → `@/api|@/types`; asset `import X from '...'` → string `/assets/...` path; SSR-safe `localStorage` (guard `typeof window`); `navigate(path,{state})` → `sessionStorage` handoff (see Handoff contract) + `router.push`. `<img>` rows get the eslint-disable comment.

- [ ] **Step 1: Create `frontend-next/components/PatientHome/SearchBar.tsx`**

```tsx
'use client';

import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from '@/i18n/navigation';

export default function SearchBar() {
  const t = useTranslations();
  const router = useRouter();
  const [userName, setUserName] = useState<string>('');
  const [query, setQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const userData = localStorage.getItem('user_data');
    if (userData) {
      const user = JSON.parse(userData);
      setUserName(user.full_name || '');
    }
  }, []);

  const handleSearch = () => {
    const q = query.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
  };

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {userName && (
        <div className="text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl lg:text-5xl font-black text-blue-900">
            {t('patient.home.greeting', { name: userName })} 👋
          </h1>
          <p className="text-sm sm:text-base lg:text-xl text-gray-500 mt-1 sm:mt-2 font-semibold">
            {t('patient.home.greeting_subtitle')}
          </p>
        </div>
      )}

      <div className="relative max-w-2xl mx-auto w-full">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('patient.home.search')}
          className="w-full bg-white border-none rounded-full py-4 sm:py-5 lg:py-6 pl-12 sm:pl-14 lg:pl-16 pr-14 sm:pr-16 text-base sm:text-lg lg:text-xl font-bold text-gray-700 shadow-xl shadow-blue-500/5 focus:ring-2 focus:ring-blue-500/20 outline-none"
        />
        <Search className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 text-gray-400" size={24} />
        {query.trim().length > 0 && (
          <button
            onClick={handleSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-[#4D71F8] hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-full text-sm transition-all active:scale-95 shadow-md"
          >
            Izla
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create `frontend-next/components/PatientHome/UpcomingAppointment.tsx`**

```tsx
'use client';

import { ArrowUpRight, Users, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useMyAppointments } from '@/api/appointments';

const DENTIST_IMG = '/assets/img/photos/Dentist.png';

export default function UpcomingAppointment() {
  const t = useTranslations();
  const router = useRouter();
  const { data: appointments, isLoading } = useMyAppointments();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-4xl" />
      </div>
    );
  }

  if (!appointments || appointments.length === 0) return null;

  const sorted = [...appointments]
    .filter(
      (a) =>
        (a.status === 'pending' || a.status === 'confirmed' || a.status === 'moved') &&
        new Date(a.start_time).getTime() > new Date().getTime()
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const upcoming = sorted[0];
  if (!upcoming) return null;

  const startTime = new Date(upcoming.start_time);
  const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const dateStr = startTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const getRemainingTime = (target: Date) => {
    const diff = target.getTime() - new Date().getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}д ${hours % 24}ч`;
    if (hours > 0) return `${hours}ч ${mins % 60}м`;
    return `${mins}м`;
  };

  const remainingTimeStr = getRemainingTime(startTime);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{t('patient.home.upcoming')}</h2>
        <button
          onClick={() => router.push('/calendar')}
          className="text-blue-600 font-bold text-sm md:text-lg flex items-center gap-1 hover:gap-2 transition-all"
        >
          {t('analytics.filter.all')}
          <ArrowUpRight size={20} />
        </button>
      </div>
      <div className="bg-blue-600 rounded-4xl p-6 lg:p-10 text-white space-y-6 shadow-xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

        <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10 relative z-10">
          <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl md:rounded-4xl overflow-hidden bg-white/20 ring-4 ring-white/10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DENTIST_IMG}
              alt="Doctor"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="flex-1 space-y-2 lg:space-y-4">
            <h3 className="text-xl lg:text-4xl font-black">{upcoming.service || t('patient.appointments.type_extraction')}</h3>
            <div className="flex items-center gap-2 opacity-90 text-sm lg:text-xl">
              <Users size={20} className="lg:size-6" />
              <span className="font-bold">{upcoming.dentist_name || 'Махмуд Пулатов'}</span>
            </div>
            <p className="text-xs lg:text-base opacity-75 font-bold tracking-wide uppercase">{t('patient.appointments.specialty_general')}</p>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => router.push(`/appointment/${upcoming.id}`)}
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl lg:rounded-3xl font-black text-sm lg:text-lg hover:bg-blue-50 transition-all active:scale-95"
            >
              {t('patient.home.more_details')}
            </button>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-xl rounded-2xl lg:rounded-3xl py-4 px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs lg:text-lg font-black border border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="lg:size-6" />
            <span>{dateStr}, {timeStr}</span>
          </div>
          <div className="w-px h-6 bg-white/20 hidden sm:block"></div>
          <div className="flex items-center gap-3 text-blue-50">
            <span className="opacity-80">До приёма:</span>
            <span className="font-mono text-sm lg:text-xl tracking-wider bg-white/20 px-4 py-1.5 rounded-xl">
              {remainingTimeStr}
            </span>
          </div>
        </div>

        <div className="md:hidden relative z-10">
          <button
            onClick={() => router.push(`/appointment/${upcoming.id}`)}
            className="w-full bg-white text-blue-600 py-3 rounded-2xl font-black text-sm active:scale-95"
          >
            {t('patient.home.more_details')}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create `frontend-next/components/PatientHome/SuggestedDoctors.tsx`**

Vite hardcoded fallbacks `t("patient.home.suggested_doctors", "Sizga яqin shifokorlar")` / `t("patient.home.see_all", "Barchasi")` → literal Uzbek strings (faithful; keys never existed). `navigate(paths.booking,{state:{doctor}})` → `sessionStorage.setItem('gosmile:booking_doctor', JSON.stringify(...))` + `router.push(paths.booking)`. `<Link to=>`→`<Link href=>`.

```tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAllDentists } from '@/api/profile';
import { useMyAppointments } from '@/api/appointments';
import { Link, useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { MapPin } from 'lucide-react';

const DOCTOR_IMG = '/assets/img/photos/Dentist.png';

export default function SuggestedDoctors() {
  const router = useRouter();
  const { data: dentists, isLoading: isLoadingDentists } = useAllDentists();
  const { data: appointments, isLoading: isLoadingAppointments } = useMyAppointments();
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const storedLocation = localStorage.getItem('user_location');
    if (storedLocation) {
      setUserLocation(JSON.parse(storedLocation));
    } else {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(loc);
          localStorage.setItem('user_location', JSON.stringify(loc));
        },
        (err) => console.log('Geolocation error:', err)
      );
    }
  }, []);

  const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const suggestedDoctors = useMemo(() => {
    if (!dentists) return [];
    let list = [...dentists];
    if (userLocation) {
      list = list
        .map((d: any) => {
          const lat = Number(d.latitude);
          const lng = Number(d.longitude);
          const dist =
            Number.isFinite(lat) && Number.isFinite(lng) && lat !== 0 && lng !== 0
              ? getDistance(userLocation.lat, userLocation.lng, lat, lng)
              : null;
          return { ...d, distance: dist };
        })
        .sort((a: any, b: any) => {
          if (a.distance === null || a.distance === undefined) return 1;
          if (b.distance === null || b.distance === undefined) return -1;
          return a.distance - b.distance;
        });
    }
    return list.slice(0, 5);
  }, [dentists, userLocation]);

  const isLoading = isLoadingDentists || isLoadingAppointments;
  const hasUpcomingAppointments = appointments && appointments.length > 0;

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[200px] h-[280px] bg-gray-100 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!dentists || dentists.length === 0 || hasUpcomingAppointments) return null;

  const goToBooking = (doctor: any) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(
        'gosmile:booking_doctor',
        JSON.stringify({
          ...doctor,
          name: doctor.full_name,
          direction: doctor.specialization || 'Stomatolog',
          image: DOCTOR_IMG,
          specialty: doctor.specialization || 'Umumiy stomatologiya',
          experience: doctor.experience_years ? `${doctor.experience_years} yil tajriba` : '',
          rating: doctor.rating || '5.0',
        })
      );
    }
    router.push(paths.booking);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2">
          <h2 className="text-2xl font-black text-gray-900 leading-tight font-serif tracking-tight">
            Sizga yaqin shifokorlar
          </h2>
          {userLocation && <MapPin size={18} className="text-blue-500 animate-bounce" />}
        </div>
        <Link href={paths.doctors} className="text-blue-600 font-bold hover:underline">
          Barchasi
        </Link>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-2 px-2">
        {suggestedDoctors.map((doctor: any) => (
          <div
            key={doctor.id}
            onClick={() => goToBooking(doctor)}
            className="min-w-[260px] bg-white border border-gray-100 rounded-[32px] p-6 text-gray-900 shadow-xl shadow-blue-500/5 cursor-pointer transition-all hover:scale-[1.02] hover:shadow-blue-500/10 active:scale-95 group"
          >
            <div className="relative mb-4">
              <div className="bg-blue-50 rounded-[24px] w-24 h-24 overflow-hidden flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={DOCTOR_IMG} alt={doctor.full_name} className="w-full h-full object-cover" />
              </div>
              {doctor.distance !== null && doctor.distance !== undefined && (
                <div className="absolute -right-2 -bottom-2 bg-[#4D71F8] text-white px-3 py-1 rounded-full text-[10px] font-black shadow-lg">
                  {Number(doctor.distance).toFixed(1)} km
                </div>
              )}
            </div>
            <h3 className="text-xl font-black mb-1 truncate text-blue-900">{doctor.full_name}</h3>
            <p className="text-gray-500 text-sm mb-4 font-semibold">{doctor.specialization || 'Stomatolog'}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-yellow-50 rounded-full px-2 py-1 text-xs font-black text-yellow-600">
                <span>⭐</span>
                <span>{doctor.rating || '5.0'}</span>
              </div>
              <span className="text-sm font-black text-blue-600 group-hover:translate-x-1 transition-transform">Band qilish →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create `frontend-next/components/PatientHome/ServicesGrid.tsx`**

`navigate(paths.doctors,{state:{specialty}})` → `sessionStorage.setItem('gosmile:doctors_specialty', specialty)` + `router.push(paths.doctors)`. Asset imports → string paths.

```tsx
'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import type { Service } from '@/types/patient';

const RASM = '/assets/img/icons/image 4 (1).svg';
const RASM2 = '/assets/img/icons/image 4.svg';
const RASM3 = '/assets/img/icons/image 4 (2).svg';
const RASM4 = '/assets/img/icons/image 4 (3).svg';

export default function ServicesGrid() {
  const t = useTranslations();
  const router = useRouter();

  const services: Service[] = [
    { icon: RASM, label: t('patient.home.services_all') },
    { icon: RASM2, label: t('patient.home.services_treatment') },
    { icon: RASM3, label: t('patient.home.services_hygiene') },
    { icon: RASM4, label: t('patient.home.services_surgery') },
  ];

  const goToDoctors = (label: string) => {
    const specialty = label === t('patient.home.services_all') ? '' : label;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gosmile:doctors_specialty', specialty);
    }
    router.push(paths.doctors);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{t('patient.home.services')}</h2>
        <button
          onClick={() => router.push(paths.specialties)}
          className="p-2.5 bg-white rounded-full shadow-lg text-blue-600 hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {services.map((service, idx) => (
          <div
            key={idx}
            onClick={() => goToDoctors(service.label)}
            className="bg-white rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center gap-4 md:gap-6 cursor-pointer group border border-gray-100 hover:border-gray-200 active:scale-95"
          >
            <div className="flex items-center justify-center text-gray-700 group-hover:text-blue-600 transition-colors">
              <div className="scale-[1.5] md:scale-[2] lg:scale-[2.5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-[36px] h-[36px]" src={service.icon} alt="" />
              </div>
            </div>
            <span className="text-xs md:text-sm lg:text-lg text-gray-700 font-extrabold text-center group-hover:text-blue-600 transition-colors uppercase tracking-wider">
              {service.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create `frontend-next/components/PatientHome/QuickActionsGrid.tsx`**

`<Link to=>`→`<Link href=>`. The unused Vite `Notification2` import + commented action are dropped (faithful: that action was already disabled/commented in Vite — rendered output identical; avoids an unused-import lint warning).

```tsx
'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { paths } from '@/lib/paths';
import type { QuickAction } from '@/types/patient';

const SCROLL_UP = '/assets/img/icons/Scroll Up.svg';
const DOCTOR = '/assets/img/icons/healthicons_doctor-male.svg';
const CONSULTATION = '/assets/img/icons/Consultation.svg';

export default function QuickActionsGrid() {
  const t = useTranslations();
  const quickActions: QuickAction[] = [
    { label: t('patient.home.action_book'), icon: SCROLL_UP, color: 'bg-blue-600 text-white', path: paths.booking },
    { label: t('patient.home.action_doctors'), icon: DOCTOR, color: 'bg-white text-blue-600', path: paths.doctors },
    { label: t('patient.home.action_my_dentist'), icon: CONSULTATION, color: 'bg-emerald-400 text-white', path: paths.myDentist },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {quickActions.map((action, idx) => (
        <Link
          key={idx}
          href={action.path}
          className={`${action.color} rounded-4xl p-6 md:p-10 flex flex-col justify-between min-h-[160px] md:min-h-[220px] lg:min-h-[280px] shadow-md transition-all duration-500 border border-transparent hover:scale-[1.02]`}
        >
          <div className="flex flex-col items-center justify-center py-2 h-full">
            <div className="flex mb-4 lg:mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-[80px] h-[80px] lg:w-[120px] lg:h-[120px] object-contain" src={action.icon} alt="" />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-base md:text-xl lg:text-2xl font-black leading-tight text-center tracking-tight">
                {action.label}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

- [ ] **Step 6: Type-check** — Run: `cd frontend-next && npx tsc --noEmit` — Expected: exit 0, no output.

- [ ] **Step 7: Commit**

```bash
git add frontend-next/components/PatientHome/
git -c commit.gpgsign=false commit -m "feat(frontend-next): port PatientHome sub-components (search/upcoming/suggested/services/quick-actions)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 4: Wire the real `/home` page

**Files:**
- Modify: `frontend-next/app/[locale]/(patient)/home/page.tsx` (full replace)

Replace the Phase-1 stub with the Vite `Pages/PatientHome.tsx` composition. Vite renders `SearchBar, UpcomingAppointment, SuggestedDoctors, ServicesGrid, QuickActionsGrid` inside `p-4 space-y-8 max-w-7xl mx-auto w-full`. The page is a plain server component (the directive lives in each child).

- [ ] **Step 1: Replace `frontend-next/app/[locale]/(patient)/home/page.tsx` entirely**

```tsx
import SearchBar from '@/components/PatientHome/SearchBar';
import UpcomingAppointment from '@/components/PatientHome/UpcomingAppointment';
import SuggestedDoctors from '@/components/PatientHome/SuggestedDoctors';
import ServicesGrid from '@/components/PatientHome/ServicesGrid';
import QuickActionsGrid from '@/components/PatientHome/QuickActionsGrid';

export default function PatientHomePage() {
  return (
    <div className="p-4 space-y-8 max-w-7xl mx-auto w-full">
      <SearchBar />
      <UpcomingAppointment />
      <SuggestedDoctors />
      <ServicesGrid />
      <QuickActionsGrid />
    </div>
  );
}
```

- [ ] **Step 2: Type-check** — Run: `cd frontend-next && npx tsc --noEmit` — Expected: exit 0, no output.

- [ ] **Step 3: Commit**

```bash
git add "frontend-next/app/[locale]/(patient)/home/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): wire real /home (PatientHome composition)

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 5: 3a build verification + manual smoke test (GATE 1)

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `cd frontend-next && npm run build`
Expected: exit 0, `✓ Compiled successfully`, **0 new warnings**. `/[locale]/home` listed (×4 locales). Static-page count unchanged or as before (route count is the same; `/home` was already a route as a stub). Note the count for the progress log.

- [ ] **Step 2: Manual smoke test**

Terminal 1: `cd backend && python run.py`
Terminal 2: `cd frontend-next && npm run dev`

In a browser, log in as a **patient**, then verify against the Vite app (`frontend/`, `localhost:5173`) side-by-side:
1. `/uz/home` renders the patient chrome: mobile (<640px) shows the bottom `app-panel` nav with 6 icons; desktop (≥1024px) shows the left `app-panel` sidebar with labels; the active item is highlighted; the notification bell shows the unread badge if any.
2. The greeting (`Привет, <name> 👋`), search bar, and (if there is an upcoming appointment) the blue UpcomingAppointment card render with correct date/time/countdown.
3. If there is **no** upcoming appointment and dentists exist, SuggestedDoctors carousel renders; otherwise it is hidden (Vite parity).
4. ServicesGrid (4 tiles) + QuickActionsGrid (3 tiles) render with correct SVG icons (no broken images — confirms the space/paren filenames resolve).
5. Locale switch (`/ru/home`, `/en/home`, `/kz/home`) keeps the layout and translated strings; no `MISSING_MESSAGE` crash.
6. Nav: clicking a bottom/sidebar item navigates locale-aware (URL keeps `/uz` etc.); routes not yet ported (`/calendar`, `/patient/chats`, etc.) 404 — **expected** until their sub-phase.

- [ ] **Step 3: No commit; STOP at gate**

This task only verifies. If the build fails or the smoke test reveals a regression vs. Vite, fix it under the relevant earlier task and re-run Steps 1–2. When 3a passes, **stop and report to the user for gate approval** before starting 3b.

---

## ROADMAP — Sub-phases 3b / 3c / 3d (NOT this session)

Each sub-phase gets its **own detailed plan file** written at its gate (matching the project's per-chunk plan-file history). Each follows the same task shape as 3a (per-component port task → `tsc --noEmit` → commit; sub-phase ends with `npm run build` + smoke gate). Route→component→API mapping (from the spec §3 + verified Vite imports):

### 3b — Discovery + Booking (gate 2) — new infra: `api/search.ts`
| Route | Vite page | Components to port | API |
|---|---|---|---|
| `/doctors` | `Doctors.tsx` | `Doctors/{DoctorsList,DoctorCard,...}` | `useAllDentists` (ported); reads `gosmile:doctors_specialty` |
| `/specialties` | `Specialties.tsx` | `Specialties/SpecialtiesList` | — |
| `/search` | `SearchResultsPage.tsx` | `Doctors/DoctorCard` | **port `api/search.ts`** (`useSearchDoctors`,`useSearchServices`) |
| `/my-dentist` | `DoctorProfilePreview.tsx` | `Complaints/ComplaintModal` | `useAllDentists` |
| `/doctor-services` | `DoctorServicesPage.tsx` | — | `api/api`, `Toast` |
| `/doctor-cases` | `DoctorCasesPage.tsx` | — | — |
| `/booking` | `Booking.tsx` | `Booking/{BookingCalendar,TimePicker,CustomDropdown,CommentInput}` | `useCreateAppointment`,`useAllDentists`,`useServices`,`Toast`; reads `gosmile:booking_doctor` |
| `/booking/checkup-preview` | `CheckupBookingPreview.tsx` | `PatientAppointmentDetail/{DoctorInfoCard,AppointmentDetailsCard,PriceCard,ReviewModal}` | — |

### 3c — Records (gate 3) — new infra: `Shared/EditProfileModal`
| Route | Vite page | Components to port | API |
|---|---|---|---|
| `/calendar` | `PatientAppointments.tsx` | `PatientAppointments/{AppointmentTabs,UpcomingAppointmentCard,PastAppointmentCard}` | `useMyAppointments` (ported) |
| `/appointment/:id` | `PatientAppointmentDetail.tsx` | `PatientAppointmentDetail/*`, `Complaints/ComplaintModal` | `useAppointment`,`useAllDentists` |
| `/history` | `PatientHistory.tsx` | `PatientHistory/{ProfileCard,MedicalInfoCard,PrescriptionCard,TreatmentsTable}` | `useMyMedcard` (ported) |
| `/profile_pat` | `PatientProfilePage.tsx` | **port `Shared/EditProfileModal`** | `usePatientProfile`,`useUpdatePatient` (ported), `Toast` |
| `/treatments` | `TreatmentsListPage.tsx` | — | — |

### 3d — Comms (gate 4) — new infra: shared `useChatSocket` hook (doctor `ChatsView` migrated onto it)
| Route | Vite page | Components to port | API |
|---|---|---|---|
| `/patient/chats` | `PatientChats.tsx` | `PatientChats/{ChatHeader,ChatListItem}` | `useMyAppointments`,`api/chat` (ported) |
| `/patient/chats/:id` | `PatientChatDetail.tsx` | `PatientChatDetail/{ChatDetailHeader,...}`, reuse `Chat/MessageBubble` | `api/chat` + new `useChatSocket` |
| `/patient/chats/:id/profile` | `ChatProfilePage.tsx` | `ChatProfile/{ProfileHeader,ProfileInfo,MediaTabs,MediaGrid,FilesList,VoiceMessagesList,LinksList}` | — |
| `/patient/notifications` | `Notifications.tsx` | (doctor `/notifications` already ported — re-route under patient layout) | `api/notifications` (ported) |
| `/video-call` | `VideoCallPage.tsx` | real `getUserMedia`; `location.state`→`sessionStorage` (`gosmile:video_call`) + `?room=` | — |

---

## Out of scope

- 3b/3c/3d implementation this session (only 3a; the rest are gated, each with its own plan file).
- Backend changes; auth model (localStorage stays); deleting/altering Vite `frontend/`.
- Real WebRTC peer connection (absent in Vite too).
- New UX/visual design (faithful port only).
- Converting hardcoded RU/UZ strings to next-intl keys.
- Netlify deploy config.

## Self-Review

- **Spec coverage:** Spec §2 port-pattern table → applied in every Task 1–4 transformation note. §3 sub-phase 3a (PatientLayout+Navbar+/home) → Tasks 1–4; 3b/3c/3d → Roadmap section with full route→component→API mapping (each to be detailed at its gate, per spec §4.4 "bu sessiyada faqat 3a"). §4 decision 1 (faithful port) → Tasks faithfully reproduce Vite incl. hidden-when-has-appointment logic; decision 4 (session = spec→review→plan→3a→gate) → Task 5 STOP. §5 gap items → flagged in Roadmap (`api/search.ts` 3b, `Shared/EditProfileModal` 3c, `useChatSocket` 3d) and pre-flight confirms `api/profile`/`medcard`/`appointments`/`notifications`/`chat`/`MessageBubble` already ported. §6 success criteria → Task 5 (tsc, build, side-by-side smoke). §8 risks → handoff contract documented (sessionStorage keys), forward-link 404 explicitly called expected.
- **Placeholder scan:** none in 3a — every created/replaced file is given in full; no "similar to", no TODO, no vague error handling (catch/`.catch(()=>{})` reproduced exactly from Vite). The Roadmap is explicitly scoped future work (not an executable task with placeholders), per writing-plans Scope Check ("suggest separate plans per subsystem").
- **Type consistency:** `Service { icon: string; label: string }` and `QuickAction { label; icon; color; path }` from `@/types/patient` match the `services`/`quickActions` literals. `useMyAppointments`/`useAllDentists`/`getUnreadCount` names match `@/api/*` exports (pre-flight verified). `PatientLayout` stays a **named** export `{ PatientLayout }` (consumed unchanged by `(patient)/layout.tsx`). `PatientNavbar`, all `PatientHome/*`, and `home/page.tsx` use **default** exports/imports consistently. `usePathname`/`useRouter`/`Link` all from `@/i18n/navigation` (same module the ported `Doshboard` uses). sessionStorage keys `gosmile:booking_doctor` / `gosmile:doctors_specialty` are written in 3a and named identically in the 3b roadmap row.
