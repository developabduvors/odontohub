# Frontend → Next.js Migration (Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** OdontoHub frontend'ning Next.js 16 (App Router) versiyasini alohida `frontend-next/` papkada Phase 1 darajasida tuzish — skafold, foundation (providers, auth, i18n, store, axios), va 6 sahifa (Welcome, Login, Register Patient, Role, Doctor Menu, Patient Home).

**Architecture:** Joriy `frontend/` (Vite) parallel ravishda qoladi. Yangi `frontend-next/` `localhost:3000` da ishlaydi, bir xil FastAPI backend (`localhost:8000`) bilan gaplashadi. JWT `localStorage`'da, axios interceptor `Authorization` header'ini qo'shadi. i18n — `next-intl` URL prefiksi bilan (`/uz/...`, `/ru/...`, `/en/...`, `/kz/...`). Auth/role guard — `'use client'` komponent layout'larda. Hamma sahifa Phase 1'da Client Component bo'ladi.

**Tech Stack:** Next.js 16.2 (App Router, Turbopack), React 19, TypeScript 5.9, Tailwind v4, Redux Toolkit, TanStack Query v5, next-intl v3, axios, react-hook-form.

**Spec:** `docs/superpowers/specs/2026-05-14-frontend-next-migration-design.md`

**Platform:** Windows + PowerShell. Hamma `npm` buyruqlari `frontend-next/` papkasida ishlatiladi.

**Testing approach:** Loyihada test runner yo'q. Har bir task'dan keyin **manual verification** bo'ladi (`npm run dev`, brauzerda ochish, DevTools). Foydalanuvchi sinashi mumkin bo'lgan har bir holat exit criteria sifatida ko'rsatiladi.

---

## Task 1: Next.js loyihasini skafold qilish

**Files:**
- Create: `frontend-next/` (yangi papka, `create-next-app` tomonidan)
- Modify: (yo'q)

- [ ] **Step 1: `create-next-app` ishga tushirish**

`OdontoHub/` papkadan turib (NOT `OdontoHub/frontend-next/`):

```powershell
npx create-next-app@latest frontend-next --typescript --eslint --tailwind --app --turbopack --no-src-dir --import-alias "@/*"
```

Savollarga javob (agar so'ralsa):
- TypeScript: Yes
- ESLint: Yes
- Tailwind: Yes
- `src/` directory: No (biz o'zimiz tuzamiz)
- App Router: Yes
- Turbopack: Yes
- Customize import alias: `@/*`

- [ ] **Step 2: Yaratilganini tekshirish**

```powershell
Get-ChildItem frontend-next
```

Kutilgan: `app/`, `public/`, `node_modules/`, `package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `eslint.config.mjs`, `.gitignore`, `README.md` mavjud.

- [ ] **Step 3: Dev server ishga tushirib tekshirish**

```powershell
cd frontend-next
npm run dev
```

Kutilgan: `http://localhost:3000` ochiladi, default Next.js welcome sahifasi ko'rinadi. `Ctrl+C` bilan to'xtatish.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/
git commit -m "feat(frontend-next): scaffold Next.js 16 project with App Router, TS, Tailwind v4"
```

---

## Task 2: Qo'shimcha dependencies o'rnatish

**Files:**
- Modify: `frontend-next/package.json` (npm install orqali)

- [ ] **Step 1: Runtime dependencies**

`frontend-next/` papkasida:

```powershell
npm install @reduxjs/toolkit react-redux @tanstack/react-query next-intl axios react-hook-form lucide-react @heroicons/react react-icons clsx swiper react-select react-content-loader leaflet react-leaflet
```

- [ ] **Step 2: Dev dependencies**

```powershell
npm install -D @types/leaflet
```

(`@types/react`, `@types/react-dom`, `@types/node`, `typescript`, `tailwindcss`, `@tailwindcss/postcss`, `eslint`, `eslint-config-next` — `create-next-app` allaqachon o'rnatgan)

- [ ] **Step 3: `package.json` ni tekshirish**

`frontend-next/package.json` ni Read tool bilan o'qing. `dependencies` ichida quyidagilar bo'lishi kerak:
- `next`, `react`, `react-dom`
- `@reduxjs/toolkit`, `react-redux`
- `@tanstack/react-query`
- `next-intl`
- `axios`
- `react-hook-form`
- `lucide-react`, `@heroicons/react`, `react-icons`
- `clsx`
- `swiper`, `react-select`, `react-content-loader`
- `leaflet`, `react-leaflet`

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/package.json frontend-next/package-lock.json
git commit -m "feat(frontend-next): install Redux, React Query, next-intl, axios, UI deps"
```

---

## Task 3: TypeScript path aliaslarini sozlash

**Files:**
- Modify: `frontend-next/tsconfig.json`

- [ ] **Step 1: tsconfig.json ni Read tool bilan o'qish**

Read: `frontend-next/tsconfig.json` — joriy `paths` bo'limini ko'rish.

- [ ] **Step 2: `paths` ga ikkinchi alias qo'shish**

`compilerOptions.paths` quyidagicha bo'lsin:

```json
"paths": {
  "@/*": ["./src/*"],
  "~/*": ["./*"]
}
```

(`@/*` — `src/` ichidagi modullar uchun; `~/*` — root level (`i18n/`, `app/`) uchun.)

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend-next/tsconfig.json
git commit -m "chore(frontend-next): add ~/* path alias for root-level imports"
```

---

## Task 4: i18n routing konfiguratsiyasi

**Files:**
- Create: `frontend-next/i18n/routing.ts`
- Create: `frontend-next/i18n/navigation.ts`

- [ ] **Step 1: `frontend-next/i18n/` papka yaratish va `routing.ts` yozish**

```ts
// frontend-next/i18n/routing.ts
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'ru',
  localePrefix: 'always',
});
```

- [ ] **Step 2: `navigation.ts` yozish**

```ts
// frontend-next/i18n/navigation.ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend-next/i18n/
git commit -m "feat(frontend-next): add next-intl routing config (uz/ru/en/kz)"
```

---

## Task 5: i18n request handler va next.config.ts wrapper

**Files:**
- Create: `frontend-next/i18n/request.ts`
- Modify: `frontend-next/next.config.ts`

- [ ] **Step 1: `request.ts` yozish**

```ts
// frontend-next/i18n/request.ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as typeof routing.locales[number])) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../src/translations/${locale}.json`)).default,
  };
});
```

- [ ] **Step 2: `next.config.ts` ni Read tool bilan o'qib, `createNextIntlPlugin` bilan o'rash**

Read: `frontend-next/next.config.ts`

Yangi mazmun:

```ts
// frontend-next/next.config.ts
import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n/request.ts');

const nextConfig: NextConfig = {
  // boshqa next sozlamalar Phase 1'da yo'q
};

export default withNextIntl(nextConfig);
```

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend-next/i18n/request.ts frontend-next/next.config.ts
git commit -m "feat(frontend-next): wire next-intl plugin and request handler"
```

---

## Task 6: i18n middleware

**Files:**
- Create: `frontend-next/middleware.ts`

- [ ] **Step 1: middleware yozish**

```ts
// frontend-next/middleware.ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

- [ ] **Step 2: Commit**

```powershell
cd ..
git add frontend-next/middleware.ts
git commit -m "feat(frontend-next): add next-intl locale detection middleware"
```

---

## Task 7: Translation fayllarini ko'chirish

**Files:**
- Create: `frontend-next/src/translations/uz.json`
- Create: `frontend-next/src/translations/ru.json`
- Create: `frontend-next/src/translations/en.json`
- Create: `frontend-next/src/translations/kz.json`

- [ ] **Step 1: Papka yaratish**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/translations" -Force | Out-Null
```

- [ ] **Step 2: 4 ta JSON faylini ko'chirish**

```powershell
Copy-Item frontend/src/translations/uz.json frontend-next/src/translations/uz.json
Copy-Item frontend/src/translations/ru.json frontend-next/src/translations/ru.json
Copy-Item frontend/src/translations/en.json frontend-next/src/translations/en.json
Copy-Item frontend/src/translations/kz.json frontend-next/src/translations/kz.json
```

- [ ] **Step 3: Plural suffix tekshiruvi**

Grep tool bilan har bir faylda `react-i18next` plural pattern'larini izlash:

Grep query: `"\w+_one":|"\w+_other":` (regex) — har bir `*.json` ustida.

**Agar topilsa:** `_one` va `_other` kalitlari ICU format'ga konvertatsiya qilinishi kerak (`{count, plural, one {...} other {...}}`). Bu konvertatsiya skriptsiz qo'lda qilinadi: har bir topilgan jufti yagona kalitga birlashtiriladi.

**Agar topilmasa:** Davom etish (joriy fayllar `next-intl` bilan to'g'ridan-to'g'ri ishlaydi).

- [ ] **Step 4: Interpolatsiya format tekshiruvi**

Grep tool bilan `{{` ni izlash: `\{\{[a-zA-Z_]+\}\}` (regex).

**Agar topilsa:** `{{var}}` → `{var}` ga aylantirilishi kerak (next-intl ICU). Har bir match qo'lda almashtiriladi (Edit tool, `replace_all: true` bilan `{{name}}` → `{name}` kabi).

**Agar topilmasa:** Davom etish.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/src/translations/
git commit -m "feat(frontend-next): port translation files (uz/ru/en/kz) and adapt to ICU format"
```

---

## Task 8: TypeScript types ko'chirish

**Files:**
- Create: `frontend-next/src/types/patient.ts`
- Create: `frontend-next/src/types/index.ts` (joriy `interfaces/` dan)

- [ ] **Step 1: Joriy types va interfaces fayllarini ko'rish**

Read: `frontend/src/types/patient.ts`
Read: `frontend/src/interfaces/index.ts` (yoki `interfaces/`'ning tarkibi)

- [ ] **Step 2: `patient.ts` ni ko'chirish**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/types" -Force | Out-Null
Copy-Item frontend/src/types/patient.ts frontend-next/src/types/patient.ts
```

- [ ] **Step 3: `interfaces/` mazmunini `src/types/index.ts` ga ko'chirish**

`frontend/src/interfaces/` ichidagi hamma `.ts` faylni `frontend-next/src/types/`'ga ko'chirish. Agar `interfaces/index.ts` mavjud bo'lsa, uni `frontend-next/src/types/index.ts` ga yozish.

```powershell
Copy-Item -Recurse frontend/src/interfaces/* frontend-next/src/types/
```

- [ ] **Step 4: Import yo'llarini tekshirish**

Ko'chirilgan fayllarda `from '../...'` import yo'llari Phase 1'da yangi pozitsiyaga mos kelmasligi mumkin. Har bir importni qo'lda tekshirib, agar relativ yo'l buzilgan bo'lsa, `@/types/...` yoki `@/...` ga aylantirish.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/src/types/
git commit -m "feat(frontend-next): port TypeScript types and interfaces"
```

---

## Task 9: Redux store ko'chirish

**Files:**
- Create: `frontend-next/src/store/store.ts`
- Create: `frontend-next/src/store/slices/userSlice.ts`
- Create: `frontend-next/src/store/hooks.ts`

- [ ] **Step 1: Papka tuzilmasi**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/store/slices" -Force | Out-Null
```

- [ ] **Step 2: `store.ts` yozish**

```ts
// frontend-next/src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import userReducer from './slices/userSlice';

export const store = configureStore({
  reducer: {
    user: userReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

- [ ] **Step 3: `userSlice.ts` yozish**

```ts
// frontend-next/src/store/slices/userSlice.ts
import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

type UserRole = 'patient' | 'dentist';

interface UserState {
  user: Record<string, any> | null;
  isAuthenticated: boolean;
  role: UserRole | null;
}

const initialState: UserState = {
  user: null,
  isAuthenticated: false,
  role: null,
};

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<Record<string, any>>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      if (action.payload.role) {
        state.role = action.payload.role;
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
    },
    updateUser: (state, action: PayloadAction<Record<string, any>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
  },
});

export const { setUser, clearUser, updateUser } = userSlice.actions;
export default userSlice.reducer;
```

(Note: Joriy `userSlice.ts` `UserRole`'ni `'../../interfaces'`'dan import qiladi. Bu yerda inline type ishlatildi — Phase 1 oddiyligi uchun. Phase 2+'da `@/types/`'ga ko'chirish mumkin.)

- [ ] **Step 4: `hooks.ts` yozish**

```ts
// frontend-next/src/store/hooks.ts
import { useDispatch, useSelector, type TypedUseSelectorHook } from 'react-redux';
import type { RootState, AppDispatch } from './store';

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/src/store/
git commit -m "feat(frontend-next): port Redux store, userSlice, and typed hooks"
```

---

## Task 10: API client (axios) ko'chirish

**Files:**
- Create: `frontend-next/src/api/api.ts`

- [ ] **Step 1: Papka tuzilmasi**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/api" -Force | Out-Null
```

- [ ] **Step 2: `api.ts` yozish**

```ts
// frontend-next/src/api/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: false,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    if (typeof window === 'undefined') return config;
    const token = localStorage.getItem('access_token');
    const isPublic = config.url === '/dentists/' || config.url === '/dentists';
    if (token && !isPublic) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['Bypass-Tunnel-Reminder'] = 'true';
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const p = window.location.pathname;
      const isAuthPage = /^\/(uz|ru|en|kz)(\/(login|register_pat|register_doc)?)?$/.test(p);
      if (!isAuthPage) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_data');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
```

- [ ] **Step 3: `.env.local` yaratish**

```powershell
"NEXT_PUBLIC_API_URL=http://localhost:8000" | Out-File -Encoding utf8 -FilePath frontend-next/.env.local
```

- [ ] **Step 4: `.gitignore` da `.env.local` mavjudligini tekshirish**

Read: `frontend-next/.gitignore` — `.env*` qatori bo'lishi kerak (create-next-app default'da qo'shadi).

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/src/api/api.ts
git commit -m "feat(frontend-next): port axios client with auth interceptor"
```

(`.env.local` git'ga qo'shilmaydi)

---

## Task 11: Redux va Query providerlari

**Files:**
- Create: `frontend-next/src/providers/ReduxProvider.tsx`
- Create: `frontend-next/src/providers/QueryProvider.tsx`

- [ ] **Step 1: Papka tuzilmasi**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/providers" -Force | Out-Null
```

- [ ] **Step 2: `ReduxProvider.tsx` yozish**

```tsx
// frontend-next/src/providers/ReduxProvider.tsx
'use client';

import { Provider } from 'react-redux';
import { store } from '@/store/store';
import type { ReactNode } from 'react';

export function ReduxProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

- [ ] **Step 3: `QueryProvider.tsx` yozish**

```tsx
// frontend-next/src/providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/src/providers/
git commit -m "feat(frontend-next): add Redux and React Query providers"
```

---

## Task 12: AuthInit provider

**Files:**
- Create: `frontend-next/src/providers/AuthInit.tsx`

- [ ] **Step 1: `AuthInit.tsx` yozish**

```tsx
// frontend-next/src/providers/AuthInit.tsx
'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';

export function AuthInit({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userRaw = localStorage.getItem('user_data');
    if (token && userRaw) {
      try {
        dispatch(setUser(JSON.parse(userRaw)));
      } catch {
        // noto'g'ri JSON — e'tiborsiz
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}
```

- [ ] **Step 2: Commit**

```powershell
cd ..
git add frontend-next/src/providers/AuthInit.tsx
git commit -m "feat(frontend-next): sync localStorage auth into Redux on mount"
```

---

## Task 13: RoleGuard

**Files:**
- Create: `frontend-next/src/guards/RoleGuard.tsx`

- [ ] **Step 1: Papka tuzilmasi**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/guards" -Force | Out-Null
```

- [ ] **Step 2: `RoleGuard.tsx` yozish**

```tsx
// frontend-next/src/guards/RoleGuard.tsx
'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '~/i18n/navigation';

type Role = 'patient' | 'dentist';

interface RoleGuardProps {
  requiredRole?: Role;
  children: ReactNode;
}

export function RoleGuard({ requiredRole, children }: RoleGuardProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.replace('/login');
      return;
    }
    const userRaw = localStorage.getItem('user_data');
    let user: { role?: Role } | null = null;
    try {
      user = userRaw ? JSON.parse(userRaw) : null;
    } catch {
      user = null;
    }
    if (requiredRole && user?.role !== requiredRole) {
      // Token bor, lekin rol noto'g'ri — role tanlash sahifasiga
      router.replace('/role');
      return;
    }
    setReady(true);
  }, [requiredRole, router]);

  if (!ready) return null;
  return <>{children}</>;
}
```

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend-next/src/guards/RoleGuard.tsx
git commit -m "feat(frontend-next): add RoleGuard client component for auth+role checks"
```

---

## Task 14: paths.ts (URL konstantalari)

**Files:**
- Create: `frontend-next/src/lib/paths.ts`

- [ ] **Step 1: Papka tuzilmasi**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/lib" -Force | Out-Null
```

- [ ] **Step 2: `paths.ts` yozish (joriy `Routes/path.ts`'dan ko'chirib)**

```ts
// frontend-next/src/lib/paths.ts
// Eslatma: bu yo'llar locale prefiksisiz. next-intl navigation
// (Link, useRouter) ulardan foydalanilsa, locale prefiksini avtomatik qo'shadi.
export const paths = {
  welcome: '/',
  role: '/role',
  login: '/login',
  registrDoc: '/register_doc',
  registerPat: '/register_pat',
  patient: '/patients',
  patientProfile: '/patients/:id',
  profile: '/profile',
  editProfile: '/profile/edit',
  menu: '/menu',
  settings: '/settings',
  appointments: '/appointments',
  analytics: '/analytics',
  finance: '/analytics/finance',
  chats: '/chats',
  chatDetail: '/chats/:id',
  patientHome: '/home',
  patientCalendar: '/calendar',
  patientHistory: '/history',
  patientProfileSettings: '/profile_pat',
  patientAppointmentDetail: '/appointment/:id',
  patientChats: '/patient/chats',
  patientChatDetail: '/patient/chats/:id',
  doctors: '/doctors',
  specialties: '/specialties',
  notifications: '/notifications',
  patientNotifications: '/patient/notifications',
  booking: '/booking',
  checkupPreview: '/booking/checkup-preview',
  myDentist: '/my-dentist',
  patientChatProfile: '/patient/chats/:id/profile',
  treatments: '/treatments',
  doctorServices: '/doctor-services',
  doctorCases: '/doctor-cases',
  videoCall: '/video-call',
  searchResults: '/search',
} as const;
```

- [ ] **Step 3: Commit**

```powershell
cd ..
git add frontend-next/src/lib/paths.ts
git commit -m "feat(frontend-next): port path constants from Routes/path.ts"
```

---

## Task 15: Layouts (Doctor MainLayout va PatientLayout placeholder)

**Files:**
- Create: `frontend-next/src/layouts/MainLayout.tsx`
- Create: `frontend-next/src/layouts/PatientLayout.tsx`

- [ ] **Step 1: Joriy layout'larni o'qish**

Read: `frontend/src/Layouts/MainLayout.tsx`
Read: `frontend/src/Layouts/PatientLayout.tsx`

- [ ] **Step 2: Papka tuzilmasi**

```powershell
New-Item -ItemType Directory -Path "frontend-next/src/layouts" -Force | Out-Null
```

- [ ] **Step 3: `MainLayout.tsx` ni ko'chirish (Doctor)**

Joriy `MainLayout.tsx` mazmunini `frontend-next/src/layouts/MainLayout.tsx` ga yozish, quyidagi o'zgartirishlar bilan:
- Birinchi qator: `'use client';`
- `<Outlet />` → `{children}` (props orqali)
- Komponent imzosi: `export function MainLayout({ children }: { children: React.ReactNode })`
- `react-router-dom`'dan `Link`, `useNavigate`, `useLocation` chaqiruvlari → `~/i18n/navigation`'dan import qilinadi:
  - `Link from 'react-router-dom'` → `Link from '~/i18n/navigation'`
  - `useNavigate()` → `useRouter()` (router.push)
  - `useLocation().pathname` → `usePathname()` (from `~/i18n/navigation`)
- Asset import'lari (`from '../assets/...`) — Phase 1'da agar muhim asset bo'lsa, `public/`'ga ko'chirish (Task 16'da batafsil). Hozircha asset'larni vaqtincha placeholder bilan almashtirish yoki commented out qilish mumkin agar bu Phase 1'da kerak bo'lmasa.

**Agar `MainLayout.tsx` juda katta bo'lsa (>200 qator):** Faqat skelet (sidebar/header navigation tugmalari + `{children}` render qiluvchi `main` element) bilan minimal versiya yarating. To'liq polishing Phase 2+'da.

Minimal versiya namunasi:

```tsx
'use client';

import { Link, usePathname } from '~/i18n/navigation';
import { paths } from '@/lib/paths';
import { useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/userSlice';
import type { ReactNode } from 'react';

export function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    dispatch(clearUser());
    window.location.href = '/login';
  }

  const items = [
    { href: paths.menu, label: 'Menu' },
    { href: paths.patient, label: 'Patients' },
    { href: paths.appointments, label: 'Appointments' },
    { href: paths.chats, label: 'Chats' },
    { href: paths.profile, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 border-r bg-slate-50 p-4">
        <h2 className="mb-6 text-xl font-bold">OdontoHub (Doctor)</h2>
        <nav className="space-y-1">
          {items.map((it) => (
            <Link
              key={it.href}
              href={it.href}
              className={`block rounded px-3 py-2 ${pathname?.endsWith(it.href) ? 'bg-blue-100 font-semibold' : 'hover:bg-slate-100'}`}
            >
              {it.label}
            </Link>
          ))}
          <button
            type="button"
            onClick={handleLogout}
            className="mt-6 block w-full rounded px-3 py-2 text-left text-red-600 hover:bg-red-50"
          >
            Logout
          </button>
        </nav>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
```

- [ ] **Step 4: `PatientLayout.tsx` ni ko'chirish**

Xuddi shu yondashuv, lekin patient nav itemlari:

```tsx
'use client';

import { Link, usePathname } from '~/i18n/navigation';
import { paths } from '@/lib/paths';
import { useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/userSlice';
import type { ReactNode } from 'react';

export function PatientLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const dispatch = useAppDispatch();

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_data');
    dispatch(clearUser());
    window.location.href = '/login';
  }

  const items = [
    { href: paths.patientHome, label: 'Home' },
    { href: paths.doctors, label: 'Doctors' },
    { href: paths.patientCalendar, label: 'Calendar' },
    { href: paths.patientChats, label: 'Chats' },
    { href: paths.patientProfileSettings, label: 'Profile' },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 p-4 pb-20">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-white">
        {items.map((it) => (
          <Link
            key={it.href}
            href={it.href}
            className={`flex-1 py-3 text-center text-sm ${pathname?.endsWith(it.href) ? 'font-semibold text-blue-600' : 'text-slate-600'}`}
          >
            {it.label}
          </Link>
        ))}
        <button
          type="button"
          onClick={handleLogout}
          className="flex-1 py-3 text-center text-sm text-red-600"
        >
          Logout
        </button>
      </nav>
    </div>
  );
}
```

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/src/layouts/
git commit -m "feat(frontend-next): add minimal MainLayout (doctor) and PatientLayout"
```

---

## Task 16: Asset'larni ko'chirish

**Files:**
- Copy: `frontend/src/assets/` → `frontend-next/public/assets/`
- Copy: `frontend/public/*` → `frontend-next/public/`

- [ ] **Step 1: Joriy assets papkasini ko'rish**

```powershell
Get-ChildItem -Recurse frontend/src/assets | Select-Object -First 30
Get-ChildItem frontend/public
```

- [ ] **Step 2: Asset'larni `public/`'ga ko'chirish**

Next.js'da statik asset'lar `public/` papkasida joylashadi. Joriy `frontend/src/assets/`'dagi rasm, ikona va boshqa fayllarni ko'chirish:

```powershell
Copy-Item -Recurse -Force frontend/src/assets frontend-next/public/assets
```

`frontend/public/`'dagi har qanday fayllar (`vite.svg` dan tashqari) ham ko'chiriladi:

```powershell
Get-ChildItem frontend/public -File | Where-Object { $_.Name -ne 'vite.svg' } | ForEach-Object {
  Copy-Item $_.FullName -Destination "frontend-next/public/$($_.Name)" -Force
}
```

- [ ] **Step 3: Eslatma — import yo'li o'zgarishi**

Joriy kodda `import LogoIcon from '../assets/img/icons/logo-icon1.png'` kabi import'lar bor. Next.js'da `public/` ichidagi asset'lar **URL string** sifatida ishlatiladi: `<img src="/assets/img/icons/logo-icon1.png" />`. Yoki, agar `next/image` ishlatilsa: `<Image src="/assets/..." width={...} height={...} />`. Bu o'zgarish har bir sahifaning Page implementation task'ida (Task 18+) qilinadi.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/public/
git commit -m "chore(frontend-next): copy static assets from frontend/src/assets and public/"
```

---

## Task 17: Root layout va globals.css

**Files:**
- Modify: `frontend-next/app/layout.tsx` (default'ni o'chirish — `[locale]/layout.tsx` ishlatamiz)
- Create: `frontend-next/app/[locale]/layout.tsx`
- Modify: `frontend-next/app/globals.css` (joriy'dan style ko'chirish kerak bo'lsa)
- Delete: `frontend-next/app/page.tsx` (default — `[locale]/page.tsx` Task 18'da)

- [ ] **Step 1: Default `app/layout.tsx` va `app/page.tsx` ni o'chirish**

`create-next-app` `app/layout.tsx`, `app/page.tsx`, `app/favicon.ico` yaratgan. `[locale]/` segment ishlatganimiz uchun root `layout.tsx` va `page.tsx` kerak emas — ammo Next.js root `app/layout.tsx`'ni majburiy talab qiladi.

Yondashuv: root `app/layout.tsx`'ni minimal qilib qoldirish (faqat HTML wrapper). `[locale]/layout.tsx` to'liq mantiqni o'z ichiga oladi.

Yangi `frontend-next/app/layout.tsx`:

```tsx
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
```

(Bu Server Component. Next.js shartiga ko'ra `app/layout.tsx` mavjud bo'lishi shart. `<html>` tegini `[locale]/layout.tsx` ichida render qilamiz.)

- [ ] **Step 2: `app/page.tsx` ni o'chirish**

```powershell
Remove-Item frontend-next/app/page.tsx
```

(`[locale]/page.tsx` Task 18'da yaratiladi. Root `/` URL middleware orqali `/ru` ga redirect bo'ladi.)

- [ ] **Step 3: `[locale]/` papka yaratish va `layout.tsx` yozish**

```powershell
New-Item -ItemType Directory -Path "frontend-next/app/[locale]" -Force | Out-Null
```

```tsx
// frontend-next/app/[locale]/layout.tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '~/i18n/routing';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthInit } from '@/providers/AuthInit';
import '../globals.css';

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as typeof routing.locales[number])) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();
  return (
    <html lang={locale}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ReduxProvider>
            <QueryProvider>
              <AuthInit>{children}</AuthInit>
            </QueryProvider>
          </ReduxProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 4: `globals.css` ni tekshirish**

`frontend-next/app/globals.css` — `create-next-app` `@import "tailwindcss"` qo'shgan. Buni saqlaymiz. Joriy `frontend/src/index.css` va `frontend/src/styles/`'dagi maxsus stilllar bo'lsa, ularni ko'rib chiqib, kerakli qismini `globals.css` ga qo'shamiz.

Read: `frontend/src/index.css`
Read: `frontend-next/app/globals.css`

Agar joriy `index.css`'da `@layer base { ... }` yoki maxsus Tailwind direktivalari bo'lsa — ularni `globals.css` oxiriga qo'shing. Agar yo'q bo'lsa, hech narsa o'zgartirmang.

- [ ] **Step 5: Dev server ishga tushirib tekshirish**

```powershell
cd frontend-next
npm run dev
```

Brauzerda `http://localhost:3000` ochiladi → middleware `/ru` ga redirect qiladi → `[locale]/layout.tsx` render bo'ladi. Hozircha `[locale]/page.tsx` yo'q, shuning uchun 404 ko'rsatilishi mumkin — bu **kutilgan**.

`Ctrl+C` bilan to'xtatish.

- [ ] **Step 6: Commit**

```powershell
cd ..
git add frontend-next/app/
git commit -m "feat(frontend-next): root [locale] layout with providers and next-intl wiring"
```

---

## Task 18: Welcome sahifa

**Files:**
- Create: `frontend-next/app/[locale]/page.tsx`

- [ ] **Step 1: Joriy `Welcome.tsx` ni o'qish**

Read: `frontend/src/Pages/Welcome.tsx` (to'liq)

- [ ] **Step 2: `app/[locale]/page.tsx` yozish**

Joriy `Welcome.tsx` mazmunini ko'chirish, quyidagi o'zgartirishlar bilan:
- Birinchi qator: `'use client';`
- `useNavigate` → `useRouter` from `~/i18n/navigation`
- `useTranslation` → `useTranslations` from `next-intl`:
  - `const { t } = useTranslation();` → `const t = useTranslations();`
- `Link` (`react-router-dom`) — Welcome ichida bormi tekshiring; agar bo'lsa `~/i18n/navigation`'dan
- Asset import: `import LogoIcon from '../assets/...'` → `'/assets/img/icons/logo-icon1.png'` (string URL)
- Tilni o'zgartirish qismi (`languageOptions.map(...)`): joriy kodda `i18n.changeLanguage(code)` chaqiruvi bor — buni:
  ```ts
  import { useRouter, usePathname } from '~/i18n/navigation';
  const router = useRouter();
  const pathname = usePathname();
  // ...
  function chooseLanguage(code: 'uz' | 'ru' | 'en' | 'kz') {
    router.replace(pathname, { locale: code });
  }
  ```
- `paths` import: `from '../Routes/path'` → `from '@/lib/paths'`

Namuna struktura (joriy Welcome'ning to'liq UI'sini saqlash):

```tsx
'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, usePathname } from '~/i18n/navigation';
import { paths } from '@/lib/paths';

type Language = 'uz' | 'ru' | 'kz' | 'en';

// languageOptions massivi — joriy fayldan o'sha-o'sha (Welcome.tsx'da hardcoded)

export default function WelcomePage() {
  const t = useTranslations();
  const router = useRouter();
  const pathname = usePathname();
  const [selected, setSelected] = useState<Language>('ru');

  // ... joriy fayldagi UI mantiqi
  // tugmasi bosilganda: router.replace(paths.login, { locale: selected });

  return (
    // joriy Welcome.tsx'dagi to'liq JSX (LogoIcon → '/assets/img/icons/logo-icon1.png')
    <div /* ... */ />
  );
}
```

- [ ] **Step 3: Dev server ishga tushirish va tekshirish**

```powershell
cd frontend-next
npm run dev
```

Brauzerda `http://localhost:3000`:
- Avto-redirect `/ru` ga bo'ladi
- Welcome sahifa ochiladi
- Til tanlash UI ishlaydi
- Bir tildan boshqasiga bosilsa, URL prefiksi o'zgaradi (`/ru/` → `/uz/`)
- "Davom etish" (yoki ekvivalent tugma) `paths.login` ga olib boradi → `/uz/login` (404 hozircha)

`Ctrl+C` bilan to'xtatish.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/app/[locale]/page.tsx
git commit -m "feat(frontend-next): port Welcome page with locale switcher"
```

---

## Task 19: Login sahifa

**Files:**
- Create: `frontend-next/app/[locale]/(public)/login/page.tsx`

- [ ] **Step 1: `(public)/login/` papka yaratish**

```powershell
New-Item -ItemType Directory -Path "frontend-next/app/[locale]/(public)/login" -Force | Out-Null
```

- [ ] **Step 2: `page.tsx` yozish**

Joriy `frontend/src/Pages/Login.tsx` mazmunini ko'chirish, quyidagi o'zgartirishlar bilan:
- Birinchi qator: `'use client';`
- `import { Link, useNavigate } from 'react-router-dom';` → `import { Link, useRouter } from '~/i18n/navigation';`
- `useNavigate()` → `useRouter()`, va `navigate(...)` → `router.push(...)`
- `useTranslation` → `useTranslations` from `next-intl`
- `useDispatch` → `useAppDispatch` from `@/store/hooks`
- `useDispatch` import o'chiriladi
- `import api from '../api/api';` → `import api from '@/api/api';`
- `import { toast } from '../components/Shared/Toast';` — Phase 1'da Toast komponenti yo'q. **Almashtirish:** `toast.error(msg)` chaqiruvlarini `alert(msg)` ga aylantiring (Phase 2'da Toast komponentini ko'chiramiz). Yoki konsolda `console.error` — lekin foydalanuvchiga ko'rinishi kerak.
- `import LogoIcon from '../assets/img/icons/logo-icon1.png';` → string yo'l: `'/assets/img/icons/logo-icon1.png'`
- `import { paths } from '../Routes/path';` → `from '@/lib/paths'`
- `import { setUser } from '../store/slices/userSlice';` → `from '@/store/slices/userSlice'`
- `import.meta.env.VITE_USE_API` → `process.env.NEXT_PUBLIC_USE_API === 'true'` (agar bu flag kerak bo'lsa; Phase 1'da har doim `true` deb hisoblash mumkin va flag'ni o'chirish)
- Login muvaffaqiyatli bo'lgach: `navigate(paths.patientHome, { replace: true })` → `router.replace(paths.patientHome)` (next-intl'ning replace metodi)
- Logo `<img src={LogoIcon} .../>` → `<img src="/assets/img/icons/logo-icon1.png" alt="GoSmile icon" />` (`Image` o'rniga oddiy `img` — Phase 1 simplicity)

To'liq misol uchun template (key parts):

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useRouter } from '~/i18n/navigation';
import { Eye, EyeOff, LockKeyhole, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';

import api from '@/api/api';
import { paths } from '@/lib/paths';
import { setUser } from '@/store/slices/userSlice';
import { useAppDispatch } from '@/store/hooks';

interface LoginData { phone: string; password: string; }

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const t = useTranslations();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginData>();

  const onSubmit = async (data: LoginData) => {
    const cleanPhone = data.phone.replace(/\s+/g, '');
    try {
      const result = await api.post('/auth/login', { phone: cleanPhone, password: data.password });
      const { access_token } = result.data;
      localStorage.setItem('access_token', access_token);
      const meResponse = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      const userData = meResponse.data;
      localStorage.setItem('user_data', JSON.stringify(userData));
      dispatch(setUser(userData));
      if (userData.role === 'patient') router.replace(paths.patientHome);
      else router.replace(paths.menu);
    } catch (err: any) {
      const detail = err.response?.data?.detail;
      alert(detail || 'Ошибка подключения к серверу');
    }
  };

  return (
    /* joriy Login.tsx JSX'i: bg gradient, logo, form, fields, submit, link to register */
    /* LogoIcon → "/assets/img/icons/logo-icon1.png" */
    /* <Link to={paths.registerPat} ...> → <Link href={paths.registerPat} ...> */
    <div className="min-h-screen ..."> {/* ... */} </div>
  );
}
```

JSX qismini joriy `frontend/src/Pages/Login.tsx` (qator 81-198) dan ko'chiring va yuqoridagi import/API o'zgarishlariga moslang.

- [ ] **Step 3: Dev server tekshiruvi**

```powershell
cd frontend-next
npm run dev
```

Brauzerda `http://localhost:3000/ru/login`:
- Login form ko'rinadi
- Telefon va password kiritiladi
- Submit'ga bosilsa, **backend** ishlab turishi kerak (`cd backend && python run.py`). Token olinadi, localStorage'ga yoziladi.
- Muvaffaqiyatli login dan keyin redirect bo'ladi:
  - Patient → `/ru/home` (404 hozircha — Task 22)
  - Doctor → `/ru/menu` (404 hozircha — Task 21)
- 401 holatda alert chiqadi
- "Нет аккаунта? Зарегистрироваться" linki `/ru/register_pat` ga olib boradi (404 hozircha — Task 20)

DevTools → Application → Local Storage'da `access_token` va `user_data` paydo bo'lishini ko'ring.

DevTools → Redux DevTools (agar o'rnatilgan bo'lsa) — `setUser` action dispatch bo'lganini ko'rasiz.

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/app/[locale]/(public)/login/
git commit -m "feat(frontend-next): port Login page with axios + Redux + next-intl wiring"
```

---

## Task 20: Register Patient sahifa

**Files:**
- Create: `frontend-next/app/[locale]/(public)/register_pat/page.tsx`

- [ ] **Step 1: Joriy `Register1.tsx` ni o'qish**

Read: `frontend/src/Pages/Register1.tsx` (to'liq)

- [ ] **Step 2: `(public)/register_pat/page.tsx` yozish**

Joriy `Register1.tsx` mazmuni ko'chiriladi (sahifa Doctor va Patient register uchun bitta komponent, role'ni URL'dan aniqlaydi). Yangi versiyada role'ni Next.js sahifa nomidan hard-code qilamiz, yoki query parametri bilan o'tkazamiz. Phase 1'da `register_pat` sahifa har doim patient registratsiyasi bo'ladi (Phase 2'da `register_doc` qo'shamiz).

Importlar Login bilan o'xshash o'zgartiriladi (`react-router-dom` → `~/i18n/navigation`, `react-i18next` → `next-intl`, `api`, `paths`, `LogoIcon` → string). `toast` o'rniga `alert`.

Endpoint: `POST /auth/register` (joriy Register1.tsx mantiqiga ko'ra). Muvaffaqiyat: `router.replace(paths.login)` yoki avtomatik login + role'ga redirect (joriy mantiqqa amal qilish).

- [ ] **Step 3: Dev server tekshiruvi**

`http://localhost:3000/ru/register_pat` — form ko'rinadi. To'ldirish va submit ishlashi kerak (backend ishlab turishi sharti).

- [ ] **Step 4: Commit**

```powershell
cd ..
git add frontend-next/app/[locale]/(public)/register_pat/
git commit -m "feat(frontend-next): port Register Patient page"
```

---

## Task 21: Auth group layout va Role sahifa

**Files:**
- Create: `frontend-next/app/[locale]/(auth)/layout.tsx`
- Create: `frontend-next/app/[locale]/(auth)/role/page.tsx`

- [ ] **Step 1: `(auth)/` group layout**

`(auth)/` group — token bor, lekin role hali tanlanmagan holat uchun. `RoleGuard`'ni `requiredRole` bermay ishlatamiz — bu token'ni tekshiradi, lekin role'ni solishtirmaydi.

```powershell
New-Item -ItemType Directory -Path "frontend-next/app/[locale]/(auth)" -Force | Out-Null
```

```tsx
// frontend-next/app/[locale]/(auth)/layout.tsx
import { RoleGuard } from '@/guards/RoleGuard';
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
```

- [ ] **Step 2: Joriy `Role.tsx` ni o'qish**

Read: `frontend/src/Pages/Role.tsx`

- [ ] **Step 3: `(auth)/role/page.tsx` yozish**

Joriy `Role.tsx` mazmunini ko'chirish:
- `'use client'`
- `useNavigate` → `useRouter` from `~/i18n/navigation`
- `useDispatch` → `useAppDispatch`
- `paths` import yangi yo'l
- Role tanlangach: PATCH `/auth/me` yoki backend endpoint orqali user role yangilanadi, keyin Redux'ga `updateUser({ role: ... })` dispatch qilinadi, `localStorage` user_data ham yangilanadi, va `router.replace(...)` (doctor → menu, patient → home).

**Eslatma:** Bu Role sahifaning to'liq backend integratsiyasi joriy `Role.tsx`'da bormi tekshiring. Agar yo'q bo'lsa (faqat klient'da role tanlanadi), unda lokalda saqlash kifoya:
```ts
const userRaw = localStorage.getItem('user_data');
const user = JSON.parse(userRaw || '{}');
user.role = chosenRole;
localStorage.setItem('user_data', JSON.stringify(user));
dispatch(setUser(user));
router.replace(chosenRole === 'patient' ? paths.patientHome : paths.menu);
```

- [ ] **Step 4: Dev server tekshiruvi**

Login (Task 19) bilan kirib, `/ru/role` ga manual ravishda boring. Sahifa ochiladi. Role tanlash UI ishlaydi.

Tokensiz `/ru/role` ga kirsangiz → `/ru/login` ga redirect bo'ladi (RoleGuard ishlashi).

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/app/[locale]/(auth)/
git commit -m "feat(frontend-next): add (auth) group with RoleGuard and Role page"
```

---

## Task 22: Doctor group layout va Menu sahifa

**Files:**
- Create: `frontend-next/app/[locale]/(doctor)/layout.tsx`
- Create: `frontend-next/app/[locale]/(doctor)/menu/page.tsx`

- [ ] **Step 1: Doctor layout**

```powershell
New-Item -ItemType Directory -Path "frontend-next/app/[locale]/(doctor)/menu" -Force | Out-Null
```

```tsx
// frontend-next/app/[locale]/(doctor)/layout.tsx
import { RoleGuard } from '@/guards/RoleGuard';
import { MainLayout } from '@/layouts/MainLayout';
import type { ReactNode } from 'react';

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRole="dentist">
      <MainLayout>{children}</MainLayout>
    </RoleGuard>
  );
}
```

- [ ] **Step 2: Joriy `Menu.tsx` ni o'qish**

Read: `frontend/src/Pages/Menu.tsx`

- [ ] **Step 3: `menu/page.tsx` yozish**

Phase 1'da Menu sahifaning to'liq UI'sini ko'chirish murakkab bo'lishi mumkin (chunki u boshqa komponentlarga bog'liq). **Minimal stub** versiyasi:

```tsx
// frontend-next/app/[locale]/(doctor)/menu/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useAppSelector } from '@/store/hooks';

export default function MenuPage() {
  const t = useTranslations();
  const user = useAppSelector((s) => s.user.user);
  return (
    <div>
      <h1 className="text-2xl font-bold">Doctor Menu</h1>
      <p className="mt-2 text-slate-600">
        Welcome, {user?.first_name || user?.name || 'Doctor'}!
      </p>
      <p className="mt-4 text-sm text-slate-500">
        (Phase 1 stub — to'liq Menu UI Phase 2'da port qilinadi)
      </p>
    </div>
  );
}
```

**Agar joriy `Menu.tsx` kichik bo'lsa va minimal dependencies'i bo'lsa**, to'liq port qilish mumkin. Bu Step 2'dagi Read natijasiga qarab qaror qilinadi.

- [ ] **Step 4: Dev server tekshiruvi**

Login (doctor sifatida) keyin `/ru/menu`'ga avto-redirect bo'lishi kerak. Doctor MainLayout sidebar ko'rinadi, asosiy maydonda "Doctor Menu" matni.

Tokensiz `/ru/menu` → `/ru/login`. Patient role bilan `/ru/menu` → `/ru/role`.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/app/[locale]/(doctor)/
git commit -m "feat(frontend-next): add (doctor) group with MainLayout and Menu stub"
```

---

## Task 23: Patient group layout va Home sahifa

**Files:**
- Create: `frontend-next/app/[locale]/(patient)/layout.tsx`
- Create: `frontend-next/app/[locale]/(patient)/home/page.tsx`

- [ ] **Step 1: Patient layout**

```powershell
New-Item -ItemType Directory -Path "frontend-next/app/[locale]/(patient)/home" -Force | Out-Null
```

```tsx
// frontend-next/app/[locale]/(patient)/layout.tsx
import { RoleGuard } from '@/guards/RoleGuard';
import { PatientLayout } from '@/layouts/PatientLayout';
import type { ReactNode } from 'react';

export default function PatientGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRole="patient">
      <PatientLayout>{children}</PatientLayout>
    </RoleGuard>
  );
}
```

- [ ] **Step 2: Joriy `PatientHome.tsx` ni o'qish (qisqacha)**

Read: `frontend/src/Pages/PatientHome.tsx` (faqat birinchi 50 qatorni — to'liq portlash Phase 2)

- [ ] **Step 3: `home/page.tsx` minimal stub**

```tsx
// frontend-next/app/[locale]/(patient)/home/page.tsx
'use client';

import { useTranslations } from 'next-intl';
import { useAppSelector } from '@/store/hooks';

export default function PatientHomePage() {
  const t = useTranslations();
  const user = useAppSelector((s) => s.user.user);
  return (
    <div>
      <h1 className="text-2xl font-bold">Patient Home</h1>
      <p className="mt-2 text-slate-600">
        Welcome, {user?.first_name || user?.name || 'Patient'}!
      </p>
      <p className="mt-4 text-sm text-slate-500">
        (Phase 1 stub — to'liq Home UI Phase 2'da port qilinadi)
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Dev server tekshiruvi**

Patient sifatida login → `/ru/home` avto-redirect. PatientLayout bottom nav ko'rinadi. "Patient Home" matni asosiy maydonda.

- [ ] **Step 5: Commit**

```powershell
cd ..
git add frontend-next/app/[locale]/(patient)/
git commit -m "feat(frontend-next): add (patient) group with PatientLayout and Home stub"
```

---

## Task 24: Lint va production build verifikatsiyasi

- [ ] **Step 1: ESLint ishlatib tekshirish**

```powershell
cd frontend-next
npm run lint
```

Kutilgan: **0 ta xato**. Ogohlantirishlar bo'lishi mumkin (unused imports, etc.) — ularni qo'lda tuzating yoki avtomatik tuzatish uchun:

```powershell
npx next lint --fix
```

- [ ] **Step 2: Production build**

```powershell
npm run build
```

Kutilgan: `✓ Compiled successfully` matni va `.next/` katalog yaratiladi. Hech qanday TypeScript yoki ESLint xatosi bo'lmasligi kerak.

**Agar build xato bersa:**
- Type errors → import yo'llari, missing types
- Module not found → path alias konfiguratsiyasi (`tsconfig.json`)
- "use client" boundary errors → Server Component'da hook chaqirilgan (texas)

Xatolarni tuzatish va qayta build qilish.

- [ ] **Step 3: Production server tekshiruvi**

```powershell
npm run start
```

`http://localhost:3000` ochiladi → `/ru` ga redirect → Welcome ko'rinadi. Login oqimi ishlashini sinash.

`Ctrl+C` bilan to'xtatish.

- [ ] **Step 4: Commit (agar lint/build tuzatishlari bo'lsa)**

```powershell
cd ..
git add frontend-next/
git commit -m "chore(frontend-next): pass lint and production build"
```

---

## Task 25: README va Phase 1 hujjati

**Files:**
- Create: `frontend-next/README.md`

- [ ] **Step 1: README yozish**

```markdown
# OdontoHub — Next.js Frontend (Phase 1)

Bu OdontoHub frontendning Next.js 16 (App Router) versiyasi. Joriy `frontend/` (Vite) versiya bilan parallel ishlaydi.

## Stack

- Next.js 16, React 19, TypeScript 5.9
- Tailwind CSS v4
- Redux Toolkit + React Redux
- TanStack Query v5
- next-intl v3 (uz / ru / en / kz)
- axios, react-hook-form, lucide-react

## Phase 1 Scope

Hozir tugallangan:
- Skafold, providerlar, i18n, auth interceptor
- Sahifalar: Welcome, Login, Register Patient, Role, Doctor Menu (stub), Patient Home (stub)
- Role-based guard: `RoleGuard` token va rol tekshiradi, redirect qiladi

Hali tugallanmagan (Phase 2+):
- Doctor: Patients, Profile, Appointments, Analytics, Chats, Notifications
- Patient: Calendar, History, Profile, Doctors, Booking, va boshqalar
- WebSocket chat, video qo'ng'iroq, leaflet xarita
- Production deployment

## Ishga tushirish

Backend ishlab turishi kerak (`cd ../backend && python run.py` — port 8000).

```powershell
cd frontend-next
npm install
npm run dev
```

`http://localhost:3000` ochilsa, avtomatik `/ru` ga redirect bo'ladi.

## Tillarni almashtirish

URL prefiksini o'zgartiring: `/uz/menu`, `/ru/menu`, `/en/menu`, `/kz/menu`. Yoki Welcome sahifadagi til tanlash UI'sidan foydalaning.

## Auth

JWT `localStorage['access_token']` da. axios interceptor `Authorization: Bearer <token>` qo'shadi. 401 javob → `localStorage` tozalanadi, `/login`'ga redirect.

## Eslatma

`frontend/` (Vite) versiya hali ham mavjud va `localhost:5173` da ishlaydi — ikkalasi bir vaqtda ishlatilishi mumkin.
```

- [ ] **Step 2: Commit**

```powershell
cd ..
git add frontend-next/README.md
git commit -m "docs(frontend-next): add Phase 1 README"
```

---

## Task 26: Yakuniy end-to-end verifikatsiya

Bu task'da yangi kod yozilmaydi — barcha exit criteria'ni bitta sessiyada sinash.

- [ ] **Step 1: Backend va frontend-next ikkisini ishga tushirish**

PowerShell terminal 1:
```powershell
cd backend
python run.py
```

PowerShell terminal 2:
```powershell
cd frontend-next
npm run dev
```

- [ ] **Step 2: Exit criteria checklist (qo'lda sinash)**

Brauzerda har bir bandni sinab, natijani tekshiring:

- [ ] `http://localhost:3000` → avtomatik `/ru` (yoki Accept-Language bo'yicha `/uz`, `/en`, `/kz`)
- [ ] Welcome sahifa to'g'ri ko'rinadi
- [ ] Til almashtirish UI ishlaydi (`/ru` → `/uz` URL va matn o'zgaradi)
- [ ] `/uz/login` → Login form ochiladi
- [ ] Patient phone/password bilan login → `/uz/home` ga avto-redirect
- [ ] Logout (PatientLayout pastki nav'da) → `/uz/login` ga qaytariladi
- [ ] Doctor phone/password bilan login → `/uz/menu` ga avto-redirect
- [ ] Logout (Doctor MainLayout sidebar'da) → `/uz/login`
- [ ] Tokensiz `/uz/menu` ga kirish → `/uz/login` redirect
- [ ] Patient token bilan `/uz/menu` → `/uz/role` redirect (cross-role guard)
- [ ] Doctor token bilan `/uz/home` → `/uz/role` redirect (cross-role guard)
- [ ] 401 backend xato → localStorage tozalanadi, `/login` redirect
- [ ] `npm run build` xatosiz tugaydi (avval Task 24'da sinaldi)
- [ ] `npm run lint` o'tadi

- [ ] **Step 3: Yakuniy commit (agar kichik tuzatishlar bo'lsa)**

```powershell
cd ..
git status
# agar o'zgarishlar bo'lsa:
git add frontend-next/
git commit -m "chore(frontend-next): Phase 1 e2e verification + final fixes"
```

- [ ] **Step 4: Yakunlash**

Phase 1 yakunlandi. Plan'ning yakuniy holati:

- ✅ 24 ta build task + 2 ta verifikatsiya task
- ✅ Joriy `frontend/` (Vite) o'zgarishsiz
- ✅ `frontend-next/` `localhost:3000`'da ishlaydi
- ✅ 6 sahifa Phase 1 darajasida: Welcome, Login, Register Patient, Role, Doctor Menu (stub), Patient Home (stub)
- ✅ Auth, i18n, providerlar, guard'lar to'liq sozlangan

**Keyingi qadam (Phase 2):** Doctor va Patient'ning qolgan sahifalarini bosqichma-bosqich port qilish (har bir phase 5-8 sahifa, alohida spec/plan/implementation cycle bilan).

---

## Self-Review (plan yozuvchi tomonidan)

**1. Spec coverage:**
- §2 Architecture & Stack → Task 1, 2, 3, 5
- §3 Folder Structure → Task 1, 4, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 21, 22, 23
- §4 Routing Migration → Task 17 (root), 18 (Welcome), 19 (Login), 20 (Register), 21 (Role), 22 (Menu), 23 (Home). Phase 1'da 6 sahifa — qolgan sahifalar Phase 2+.
- §5 Providers & Auth → Task 10, 11, 12, 13, 17
- §6 i18n → Task 4, 5, 6, 7, 17
- §7 Phase 1 Exit Criteria → Task 24, 26

**Gap:** Backend CORS update — spec'da mavjud edi, lekin reality check: backend `main.py` allaqachon `http://localhost:3000` ni allow qiladi (joriy holat). Demak task'ga ehtiyoj yo'q — README'da eslatma kifoya.

**2. Placeholders:**
- Task 8 Step 4 "Import yo'llarini tekshirish" — bu tekshiruv harakat, code'ga aniq misol berildi (`@/types/...`'ga aylantirish).
- Task 15 Step 3 — `MainLayout.tsx` katta bo'lsa minimal versiya tavsiya etilgan, minimal versiyaning to'liq kodi berilgan. Yaxshi.
- Task 19 Step 2 "JSX qismini joriy fayldan ko'chiring" — bu ko'chirish qadami, lekin Login.tsx 200 qator atrofida bo'lgani uchun plan'da to'liq JSX qoldirish — plan hajmini juda kattalashtiradi. Joriy fayl read qilinadi va port qilinadi — bu workflow aniq, lekin "real time" file content'ni copy qilish — agent'ning vazifasi.

**3. Type consistency:**
- `Role` type: `'patient' | 'dentist'` — Task 9 (userSlice), 13 (RoleGuard) bir xil. ✅
- `paths.patientHome`: `/home` — Task 14, 19, 22 da bir xil ishlatildi. ✅
- `RoleGuard` props: `requiredRole?: Role` — Task 13'da deklaratsiya, Task 21 (no role), 22 (`"dentist"`), 23 (`"patient"`) — mos. ✅

**4. Ambiguity check:**
- Task 15 `MainLayout` ichida `paths.menu` "Menu" deb tarjima qilinmadi (ingliz). i18n integratsiyasi minimal layout'da yo'q — Phase 2'da `useTranslations` qo'shamiz.
- Task 19'da `import.meta.env.VITE_USE_API` — Phase 1'da bu flag o'chiriladi (har doim API ishlatamiz), aniq aytildi. ✅
- Task 20 Register Patient — joriy `Register1.tsx` Doctor va Patient ikkalasi uchun. Phase 1'da faqat patient — sahifa nomidan role aniqlanadi. ✅
