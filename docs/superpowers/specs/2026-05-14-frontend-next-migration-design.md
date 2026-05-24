# Frontend → Next.js Migration — Design Spec

**Date:** 2026-05-14
**Status:** Draft (awaiting user review)
**Author:** Brainstorming session with Claude
**Scope:** Phase 1 — Foundation + 6 sahifa skafold

---

## 1. Maqsad va konteks

OdontoHub joriy frontend stack'i:
- React 19 + TypeScript + Vite 7
- Redux Toolkit + TanStack Query v5
- Tailwind CSS v4
- `react-router-dom` v7 (`createBrowserRouter`)
- `react-i18next` + `i18next` (4 til: uz, ru, en, kz)
- `react-hook-form`, `axios`, `leaflet`/`react-leaflet`, `swiper`
- JWT auth `localStorage['access_token']`'da, axios interceptor `Authorization` header'ini qo'shadi

**Maqsad:** Frontend'ni Next.js 16 (App Router, latest stable) bilan **alohida `frontend-next/` papkada** qayta tuzish. Eski `frontend/` o'zgarishsiz qoladi va parallel ravishda ishlab turadi.

**Asosiy qarorlar (brainstorming davomida tasdiqlangan):**
1. **Strategiya:** alohida yangi loyiha (`frontend-next/`), eski Vite versiya tegmaydi
2. **Maqsad:** modern stack + yaxshi DX (SEO/SSR kelajakda Phase 2+'da)
3. **Backend:** FastAPI o'sha-o'sha qoladi. JWT localStorage'da. Cookie auth'ga o'tilmaydi.
4. **i18n:** `next-intl` (Next.js standart) — URL'da til prefiksi (`/uz/`, `/ru/`, `/en/`, `/kz/`)
5. **Hajm:** **Foundation first** — skafold + auth + 5-6 sahifa Phase 1'da, qolgan 30+ sahifa Phase 2+'da

---

## 2. Architecture va Stack

**Loyiha:** `OdontoHub/frontend-next/` (joriy `frontend/` parallel ravishda mavjud)

**Stack:**

| Layer | Kutubxona | Izoh |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack) | Latest stable: `16.2.2` |
| UI | React 19 | Next 16 bilan birga keladi |
| Tipizatsiya | TypeScript 5.9+ | Strict mode |
| Styling | Tailwind CSS v4 | `@tailwindcss/postcss` plugini (Vite plagini emas) |
| State (client) | `@reduxjs/toolkit` + `react-redux` | Joriy `store.ts` ko'chiriladi |
| Server state | `@tanstack/react-query` v5 | Har bir `useQuery` Client Component'da chaqiriladi |
| i18n | `next-intl` v3 | Joriy `react-i18next` o'rniga |
| Forms | `react-hook-form` | Joriy holatdek |
| HTTP | `axios` | Joriy `api/api.ts` asosida, interceptor saqlanadi |
| Icons | `lucide-react`, `@heroicons/react`, `react-icons` | Hammasi qoladi |
| UI extras | `swiper`, `react-select`, `react-content-loader` | Hammasi qoladi |
| Maps | `leaflet`, `react-leaflet` | `next/dynamic` orqali `ssr: false` |

**Rendering strategiyasi:**
- Asosan **Client-Side Rendering (CSR)** — chunki auth `localStorage`'da, ko'pchilik sahifa interaktiv
- Phase 1'dagi hamma sahifa `'use client'` direktivasi bilan
- Public sahifalar (Welcome, dentist katalogi) kelajakda (Phase 2+) Server Component'ga o'tkazilishi mumkin

**Auth strategiyasi:**
- JWT `localStorage['access_token']` (joriy holatdek)
- `axios` interceptor `Authorization: Bearer <token>` qo'shadi (`/dentists/` public istisno)
- `RoleGuard` (Client Component, `useEffect` ichida localStorage tekshiruvi) — token yo'q yoki noto'g'ri rol bo'lsa redirect
- Backend tegmaydi

---

## 3. Folder Structure

```
frontend-next/
├── app/                                ← Next.js App Router
│   ├── [locale]/                       ← Dynamic i18n segment
│   │   ├── layout.tsx                  ← Server Component, providerlar
│   │   ├── page.tsx                    ← Welcome
│   │   ├── (public)/                   ← Route group: auth talab qilmaydi
│   │   │   ├── login/page.tsx
│   │   │   ├── register_pat/page.tsx
│   │   │   └── register_doc/page.tsx
│   │   ├── (auth)/                     ← Auth bor, role yo'q
│   │   │   └── role/page.tsx
│   │   ├── (doctor)/                   ← Route group: dentist roli
│   │   │   ├── layout.tsx              ← MainLayout + RoleGuard("dentist")
│   │   │   ├── menu/page.tsx
│   │   │   ├── patients/page.tsx       ← Phase 2+
│   │   │   ├── patients/[id]/page.tsx  ← Phase 2+
│   │   │   ├── profile/page.tsx        ← Phase 2+
│   │   │   ├── profile/edit/page.tsx   ← Phase 2+
│   │   │   ├── settings/page.tsx       ← Phase 2+
│   │   │   ├── appointments/page.tsx   ← Phase 2+
│   │   │   ├── analytics/page.tsx      ← Phase 2+
│   │   │   ├── analytics/finance/page.tsx ← Phase 2+
│   │   │   ├── chats/page.tsx          ← Phase 2+
│   │   │   ├── chats/[id]/page.tsx     ← Phase 2+
│   │   │   └── notifications/page.tsx  ← Phase 2+
│   │   └── (patient)/                  ← Route group: patient roli
│   │       ├── layout.tsx              ← PatientLayout + RoleGuard("patient")
│   │       ├── home/page.tsx
│   │       ├── calendar/page.tsx       ← Phase 2+
│   │       ├── appointment/[id]/page.tsx ← Phase 2+
│   │       ├── history/page.tsx        ← Phase 2+
│   │       ├── profile_pat/page.tsx    ← Phase 2+
│   │       ├── patient/chats/page.tsx  ← Phase 2+
│   │       ├── patient/chats/[id]/page.tsx ← Phase 2+
│   │       ├── patient/chats/[id]/profile/page.tsx ← Phase 2+
│   │       ├── doctors/page.tsx        ← Phase 2+
│   │       ├── specialties/page.tsx    ← Phase 2+
│   │       ├── patient/notifications/page.tsx ← Phase 2+
│   │       ├── booking/page.tsx        ← Phase 2+
│   │       ├── booking/checkup-preview/page.tsx ← Phase 2+
│   │       ├── my-dentist/page.tsx     ← Phase 2+
│   │       ├── doctor-services/page.tsx ← Phase 2+
│   │       ├── doctor-cases/page.tsx   ← Phase 2+
│   │       ├── video-call/page.tsx     ← Phase 2+
│   │       ├── treatments/page.tsx     ← Phase 2+
│   │       └── search/page.tsx         ← Phase 2+
│   └── globals.css                     ← Tailwind import
│
├── src/                                ← Reusable kod
│   ├── api/                            ← axios + domain fayllar
│   │   ├── api.ts
│   │   └── (qolgan domain modullar Phase 2+'da)
│   ├── components/                     ← Shared UI (Phase 2+ da kengayadi)
│   ├── store/
│   │   ├── store.ts
│   │   ├── hooks.ts
│   │   └── slices/userSlice.ts
│   ├── hooks/                          ← Custom hooks (Phase 2+)
│   ├── providers/
│   │   ├── ReduxProvider.tsx
│   │   ├── QueryProvider.tsx
│   │   └── AuthInit.tsx
│   ├── guards/
│   │   └── RoleGuard.tsx
│   ├── layouts/
│   │   ├── MainLayout.tsx              ← Doctor layout
│   │   └── PatientLayout.tsx
│   ├── lib/
│   │   └── paths.ts                    ← URL konstantalari
│   ├── types/
│   │   └── patient.ts
│   └── translations/
│       ├── uz.json
│       ├── ru.json
│       ├── en.json
│       └── kz.json
│
├── public/                             ← Static assets (`frontend/public` + `frontend/src/assets`'dan ko'chiriladi)
├── i18n/
│   ├── routing.ts
│   ├── request.ts
│   └── navigation.ts
├── middleware.ts                       ← next-intl middleware
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs                  ← Tailwind v4 PostCSS plugini
├── eslint.config.mjs
├── package.json
└── .env.local                          ← NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Joriy → Yangi xaritalash:**

| Joriy (`frontend/src/`) | Yangi (`frontend-next/`) |
|---|---|
| `Pages/Welcome.tsx` | `app/[locale]/page.tsx` |
| `Pages/Login.tsx` | `app/[locale]/(public)/login/page.tsx` |
| `Pages/Menu.tsx` | `app/[locale]/(doctor)/menu/page.tsx` |
| `Routes/index.tsx` (createBrowserRouter) | (yo'q — file routing) |
| `Routes/path.ts` | `src/lib/paths.ts` |
| `HOC/PrivateRoute.tsx`, `PublickRoute.tsx` | `src/guards/RoleGuard.tsx` + layout'lar |
| `Layouts/MainLayout.tsx`, `PatientLayout.tsx` | `src/layouts/*.tsx` (group `layout.tsx`'da ishlatiladi) |
| `main.tsx` (ReactDOM.render) | `app/[locale]/layout.tsx` (providerlar) |
| `i18n.js` | `i18n/request.ts` + `i18n/routing.ts` + `i18n/navigation.ts` |
| `vite.config.ts` proxy | (yo'q — axios `baseURL` to'g'ridan-to'g'ri backend'ga) |
| (yo'q) | `next.config.ts` (`createNextIntlPlugin` wrapper) |
| `translations/uz.json` (...) | `src/translations/uz.json` (...) |

---

## 4. Routing Migration Map

URL'lar **o'zgarmaydi** — faqat oldiga locale prefiksi qo'shiladi (`/menu` → `/uz/menu`).

**Public:**

| Joriy URL | App Router fayli |
|---|---|
| `/` | `app/[locale]/page.tsx` |
| `/login` | `app/[locale]/(public)/login/page.tsx` |
| `/register_pat` | `app/[locale]/(public)/register_pat/page.tsx` |
| `/register_doc` | `app/[locale]/(public)/register_doc/page.tsx` |
| `/role` | `app/[locale]/(auth)/role/page.tsx` |

**Doctor (Phase 1: `/menu` faqat; qolgan Phase 2+):**

| Joriy URL | App Router fayli |
|---|---|
| `/menu` | `app/[locale]/(doctor)/menu/page.tsx` |
| `/patients` | `app/[locale]/(doctor)/patients/page.tsx` |
| `/patients/:id` | `app/[locale]/(doctor)/patients/[id]/page.tsx` |
| `/profile` | `app/[locale]/(doctor)/profile/page.tsx` |
| `/profile/edit` | `app/[locale]/(doctor)/profile/edit/page.tsx` |
| `/settings` | `app/[locale]/(doctor)/settings/page.tsx` |
| `/appointments` | `app/[locale]/(doctor)/appointments/page.tsx` |
| `/analytics` | `app/[locale]/(doctor)/analytics/page.tsx` |
| `/analytics/finance` | `app/[locale]/(doctor)/analytics/finance/page.tsx` |
| `/chats` | `app/[locale]/(doctor)/chats/page.tsx` |
| `/chats/:id` | `app/[locale]/(doctor)/chats/[id]/page.tsx` |
| `/notifications` | `app/[locale]/(doctor)/notifications/page.tsx` |

**Patient (Phase 1: `/home` faqat; qolgan Phase 2+):**

| Joriy URL | App Router fayli |
|---|---|
| `/home` | `app/[locale]/(patient)/home/page.tsx` |
| `/calendar` | `app/[locale]/(patient)/calendar/page.tsx` |
| `/appointment/:id` | `app/[locale]/(patient)/appointment/[id]/page.tsx` |
| `/history` | `app/[locale]/(patient)/history/page.tsx` |
| `/profile_pat` | `app/[locale]/(patient)/profile_pat/page.tsx` |
| `/patient/chats` | `app/[locale]/(patient)/patient/chats/page.tsx` |
| `/patient/chats/:id` | `app/[locale]/(patient)/patient/chats/[id]/page.tsx` |
| `/patient/chats/:id/profile` | `app/[locale]/(patient)/patient/chats/[id]/profile/page.tsx` |
| `/doctors` | `app/[locale]/(patient)/doctors/page.tsx` |
| `/specialties` | `app/[locale]/(patient)/specialties/page.tsx` |
| `/patient/notifications` | `app/[locale]/(patient)/patient/notifications/page.tsx` |
| `/booking` | `app/[locale]/(patient)/booking/page.tsx` |
| `/booking/checkup-preview` | `app/[locale]/(patient)/booking/checkup-preview/page.tsx` |
| `/my-dentist` | `app/[locale]/(patient)/my-dentist/page.tsx` |
| `/doctor-services` | `app/[locale]/(patient)/doctor-services/page.tsx` |
| `/doctor-cases` | `app/[locale]/(patient)/doctor-cases/page.tsx` |
| `/video-call` | `app/[locale]/(patient)/video-call/page.tsx` |
| `/treatments` | `app/[locale]/(patient)/treatments/page.tsx` |
| `/search` | `app/[locale]/(patient)/search/page.tsx` |

**API mapping — `react-router-dom` → `next/navigation` + `next-intl`:**

| react-router-dom | Yangi |
|---|---|
| `useNavigate()` → `navigate('/menu')` | `useRouter()` (from `@/../i18n/navigation`) → `router.push('/menu')` |
| `useParams()` | `useParams()` (from `next/navigation`) |
| `useLocation()` | `usePathname()` + `useSearchParams()` |
| `<Link to="/menu">` | `<Link href="/menu">` (from `@/../i18n/navigation`) |
| `<Outlet />` | `layout.tsx` ichida `{children}` |
| `<Navigate to="/login" />` | `useEffect` ichida `router.replace('/login')` (Client) |

---

## 5. Providers, Auth va Data Layer

### Provider daraxti

```
app/[locale]/layout.tsx                ← Server Component
  └─ <html><body>
      └─ <NextIntlClientProvider>      ← next-intl (server'dan messages)
          └─ <ReduxProvider>           ← 'use client'
              └─ <QueryProvider>       ← 'use client'
                  └─ <AuthInit>        ← 'use client', localStorage→Redux sync
                      └─ {children}
```

### `src/providers/ReduxProvider.tsx`

```tsx
'use client';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import type { ReactNode } from 'react';
export function ReduxProvider({ children }: { children: ReactNode }) {
  return <Provider store={store}>{children}</Provider>;
}
```

### `src/providers/QueryProvider.tsx`

```tsx
'use client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60_000, retry: 1, refetchOnWindowFocus: false } }
  }));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

### `src/providers/AuthInit.tsx`

```tsx
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
      try { dispatch(setUser({ token, user: JSON.parse(userRaw) })); }
      catch { /* tushunarsiz JSON — e'tiborsiz */ }
    }
  }, [dispatch]);
  return <>{children}</>;
}
```

### `src/api/api.ts`

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: false,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  if (typeof window === 'undefined') return config;
  const token = localStorage.getItem('access_token');
  const isPublic = config.url === '/dentists/' || config.url === '/dentists';
  if (token && !isPublic) config.headers.Authorization = `Bearer ${token}`;
  config.headers['Bypass-Tunnel-Reminder'] = 'true';
  return config;
});

api.interceptors.response.use(
  (r) => r,
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
  }
);

export default api;
```

### `src/guards/RoleGuard.tsx`

```tsx
'use client';
import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '~/i18n/navigation';

type Role = 'patient' | 'dentist';

export function RoleGuard({
  requiredRole,
  children,
}: { requiredRole?: Role; children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) { router.replace('/login'); return; }
    const userRaw = localStorage.getItem('user_data');
    const user = userRaw ? JSON.parse(userRaw) : null;
    if (requiredRole && user?.role !== requiredRole) {
      router.replace('/role');
      return;
    }
    setReady(true);
  }, [requiredRole, router]);

  if (!ready) return null;  // yoki loading spinner
  return <>{children}</>;
}
```

### Group layout'lar misol

`app/[locale]/(doctor)/layout.tsx` — Server Component (default):

```tsx
import { RoleGuard } from '@/guards/RoleGuard';
import { MainLayout } from '@/layouts/MainLayout';
export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard requiredRole="dentist">
      <MainLayout>{children}</MainLayout>
    </RoleGuard>
  );
}
```

Bu layout o'zi `'use client'` emas, lekin `RoleGuard` va `MainLayout` ikkalasi ham `'use client'` (Client Component'lar). Layout'ni Server Component qilib qoldirish — render performance uchun yaxshi (komponent daraxti faqat kerakli qismi client'da render bo'ladi).

Xuddi shunday `app/[locale]/(patient)/layout.tsx` — `RoleGuard requiredRole="patient"` bilan `PatientLayout`.

`app/[locale]/(auth)/role/page.tsx` — auth tekshiruvi: token bor, role yo'q. Buni `<RoleGuard>` (without `requiredRole`) bilan o'rab qo'yamiz — token tekshiradi, lekin role solishtirmaydi.

---

## 6. i18n with next-intl

**Locales:** `['uz', 'ru', 'en', 'kz']`
**Default:** `'ru'`
**Prefix:** `'always'` — har doim URL'da locale

### `i18n/routing.ts`

```ts
import { defineRouting } from 'next-intl/routing';
export const routing = defineRouting({
  locales: ['uz', 'ru', 'en', 'kz'],
  defaultLocale: 'ru',
  localePrefix: 'always',
});
```

### `i18n/navigation.ts`

```ts
import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
```

### `i18n/request.ts`

```ts
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../src/translations/${locale}.json`)).default,
  };
});
```

### `middleware.ts`

```ts
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
export default createMiddleware(routing);
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
```

### `app/[locale]/layout.tsx`

```tsx
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '../../i18n/routing';
import { ReduxProvider } from '@/providers/ReduxProvider';
import { QueryProvider } from '@/providers/QueryProvider';
import { AuthInit } from '@/providers/AuthInit';
import './../globals.css';

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
  if (!routing.locales.includes(locale as any)) notFound();
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

### API mapping — `react-i18next` → `next-intl`

| react-i18next | next-intl |
|---|---|
| `const { t } = useTranslation();` | `const t = useTranslations();` (`'use client'`) yoki `getTranslations()` (Server) |
| `t('key')` | `t('key')` (bir xil) |
| `t('key', { name: 'X' })` | `t('key', { name: 'X' })` (ICU format) |
| `i18n.changeLanguage('uz')` | `router.replace(pathname, { locale: 'uz' })` |
| `i18n.language` | `useLocale()` |
| `<Trans i18nKey="foo" />` | `t.rich('foo', { tag: (c) => <strong>{c}</strong> })` |

### Til o'zgartirish

```tsx
'use client';
import { useRouter, usePathname } from '~/i18n/navigation';
export function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  return (
    <select onChange={(e) => router.replace(pathname, { locale: e.target.value })}>
      <option value="ru">RU</option>
      <option value="uz">UZ</option>
      <option value="en">EN</option>
      <option value="kz">KZ</option>
    </select>
  );
}
```

### Plurals va ICU format

Joriy `frontend/src/translations/*.json` fayllarida agar `react-i18next` plural suffixlari bo'lsa (`key_one`, `key_other`), ular **ICU format'ga** konvertatsiya qilinishi kerak:
- `react-i18next:` `{ "msg_one": "{{count}} item", "msg_other": "{{count}} items" }`
- `next-intl:` `{ "msg": "{count, plural, one {# item} other {# items}}" }`

Migration'da har bir til fayli skan qilinadi, plural'lar topilsa konvertatsiya bo'ladi. Soddiy `{{var}}` interpolatsiyalari `{var}`'ga aylanadi.

---

## 7. Phase 1 Scope va Exit Criteria

### IN SCOPE

**Skafold:**
- `frontend-next/` papka, `create-next-app@latest` (TS, App Router, Tailwind, ESLint, Turbopack)
- Dependencies: next, react, redux toolkit, react-redux, tanstack/react-query, next-intl, axios, react-hook-form, lucide-react, @heroicons/react, react-icons, clsx, swiper, react-select, react-content-loader, leaflet, react-leaflet
- `tsconfig.json` path aliaslari:
  - `"@/*": ["./src/*"]`
  - `"~/*": ["./*"]` (root-level `i18n/`, `app/` uchun import qilish)
- `next.config.ts` — `createNextIntlPlugin` orqali o'raladi:
  ```ts
  import createNextIntlPlugin from 'next-intl/plugin';
  const withNextIntl = createNextIntlPlugin('./i18n/request.ts');
  export default withNextIntl({ /* boshqa Next sozlamalar */ });
  ```
- `.env.local` — `NEXT_PUBLIC_API_URL=http://localhost:8000`
- `eslint.config.mjs`, `postcss.config.mjs` (Tailwind v4)

**Foundation kod:**
- `i18n/routing.ts`, `request.ts`, `navigation.ts`
- `middleware.ts`
- `src/translations/{uz,ru,en,kz}.json` — joriy fayllar ko'chiriladi va plural'lar ICU'ga konvertatsiya qilinadi
- `src/api/api.ts`
- `src/store/store.ts`, `slices/userSlice.ts`, `hooks.ts`
- `src/providers/{Redux,Query,AuthInit}.tsx`
- `src/guards/RoleGuard.tsx`
- `src/layouts/{MainLayout,PatientLayout}.tsx` (basic versions, full polishing — Phase 2+)
- `src/lib/paths.ts`
- `src/types/patient.ts`
- `app/[locale]/layout.tsx`

**Phase 1 sahifalari (6 ta):**

| Sahifa | Yo'l | Maqsad |
|---|---|---|
| Welcome | `app/[locale]/page.tsx` | Public landing |
| Login | `app/[locale]/(public)/login/page.tsx` | POST `/auth/login`, token saqlash, redirect |
| Register Patient | `app/[locale]/(public)/register_pat/page.tsx` | POST register, redirect |
| Role | `app/[locale]/(auth)/role/page.tsx` | Role tanlash (agar yo'q bo'lsa) |
| Menu (doctor) | `app/[locale]/(doctor)/menu/page.tsx` | Doctor guard test |
| Home (patient) | `app/[locale]/(patient)/home/page.tsx` | Patient guard test |

### OUT OF SCOPE (Phase 2+'da)

- Doctor: `/patients`, `/patients/:id`, `/profile`, `/profile/edit`, `/settings`, `/appointments`, `/analytics`, `/analytics/finance`, `/chats`, `/chats/:id`, `/notifications`
- Patient: `/calendar`, `/appointment/:id`, `/history`, `/profile_pat`, `/patient/chats`, `/patient/chats/:id`, `/patient/chats/:id/profile`, `/doctors`, `/specialties`, `/patient/notifications`, `/booking`, `/booking/checkup-preview`, `/my-dentist`, `/doctor-services`, `/doctor-cases`, `/video-call`, `/treatments`, `/search`
- `/register_doc` (doctor registratsiya — Phase 1'da faqat patient register, doctor Phase 2'da)
- WebSocket chat integratsiyasi
- `react-leaflet` xarita integratsiyasi
- Video qo'ng'iroq
- Image upload oqimi
- Production deployment config (Netlify)

### Exit Criteria

Phase 1 yakunlangan deyish uchun **hammasi** ishlashi kerak:

1. `cd frontend-next && npm install` muvaffaqiyatli tugaydi
2. `npm run dev` ishga tushadi, `http://localhost:3000` ochiladi
3. `/` URL avtomatik locale'ga redirect bo'ladi (default `/ru`, Accept-Language asosida `/uz`/`/en`/`/kz`)
4. Til almashtirish: `/ru` → `/uz` URL'ni va sahifa mazmunini almashtiradi
5. Welcome sahifa ochiladi, til kalitlari to'g'ri ko'rsatiladi
6. `/login` form ishlaydi: `POST /auth/login` so'rovi yuboriladi, javobdan `access_token` va `user_data` localStorage'ga yoziladi, Redux'ga ham yoziladi
7. Login muvaffaqiyatli bo'lsa, `user.role` ga qarab `/menu` (dentist) yoki `/home` (patient) ga redirect
8. Token yo'q holatda `/menu` ga kirishga urinish → `/login` ga redirect (RoleGuard ishlashi)
9. Patient role bilan `/menu`'ga kirish → `/role` ga redirect (cross-role guard)
10. Logout (clearUser + localStorage clear) → `/login` ga qaytariladi
11. Backend 401 javob bersa, interceptor localStorage'ni tozalab `/login` ga redirect
12. `npm run build` xatosiz tugaydi (production build sinash)
13. `npm run lint` o'tadi
14. **Backend CORS** — `backend/app/main.py`'da `CORSMiddleware` allow_origins va `ALLOWED_ORIGINS` ro'yxatlariga `http://localhost:3000` qo'shilgan (Phase 1 mavjudligi shart)

### Deliverables

- `frontend-next/` — to'liq commit qilingan
- `docs/superpowers/specs/2026-05-14-frontend-next-migration-design.md` — bu hujjat
- `frontend-next/README.md` — ishga tushirish ko'rsatmasi, Phase 1 nima ishlayotgani ro'yxati
- Backend kichik o'zgarishi: `CORSMiddleware`'ga `http://localhost:3000` qo'shilishi

### Risklar va mitigatsiya

| Risk | Mitigatsiya |
|---|---|
| Translation JSON'lardagi plural'lar `react-i18next` formatida | Migration scriptida `_one`/`_other` aniqlash va ICU formatga aylantirish |
| Tailwind v4 + Next.js 16 PostCSS konflikti | Stable versiyalar bo'lsa-da, agar muammo bo'lsa Tailwind v3'ga qaytish (backup plan) |
| `react-router-dom` chaqiruvlari `components/`'da yashirin | Phase 1'da faqat 6 sahifa + foundation, har bir komponentni qo'lda port qilishda topiladi |
| `import.meta.env.VITE_*` `components/`'da yana bor | Ko'chirayotganda `process.env.NEXT_PUBLIC_*`'ga almashadi |
| Backend `CORS` `http://localhost:3000` ni qabul qilmaydi | Backend `main.py`'ga `localhost:3000` qo'shish (small change) |
| Hydration mismatch (`localStorage` Server'da yo'q) | Hamma `localStorage` chaqiruvi `useEffect` ichida, `RoleGuard` `ready` state'i bilan ishlaydi |

---

## 8. Keyingi qadam (Phase 2+ prevyu, scope'dan tashqari)

Phase 1 muvaffaqiyatli yakunlangach, Phase 2+'da:
- Phase 2: Doctor sahifalari (Patients ro'yxati, Profile, Settings, Appointments) — 5-7 sahifa
- Phase 3: Patient sahifalari (Calendar, History, Profile, Doctors, Specialties, Booking) — 6-8 sahifa
- Phase 4: Chat (WebSocket) + Notifications — Doctor va Patient ikkalasiga
- Phase 5: Maps (`react-leaflet`), Video call
- Phase 6: Polish, production build, Netlify deployment, ESLint/test polishing

Har bir phase o'z spec/plan/implementation cycle'iga ega bo'ladi.

---

## 9. Imzo va tasdiqlash

- **Brainstorming yakuni:** 2026-05-14
- **Yozildi:** Claude (Opus 4.7), brainstorming skill
- **Tasdiqlandi:** _<kutilmoqda>_
- **Implementation plan:** spec tasdiqlangach `writing-plans` skill orqali tuziladi
