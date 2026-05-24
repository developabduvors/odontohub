# Register role selection (Пациент/Врач) — frontend-next port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore the Пациент/Врач role choice in frontend-next registration by porting Vite `Register1.tsx` into one shared `RegisterView` component rendered by two routes (`/register_pat`, `/register_doc`).

**Architecture:** A single `'use client'` component owns the form, layout, and submit. Two thin page files inject the role via a prop. The role is a route fact — the selector buttons just navigate between the two routes; selected state is derived from the prop, not local state.

**Tech Stack:** Next.js 16 App Router, React 19, react-hook-form, next-intl navigation (`@/i18n/navigation`), axios (`@/api/api`), Redux Toolkit (`@/store`), lucide-react, Tailwind v4. Hardcoded Russian strings (no next-intl keys), faithful to the Vite source and the existing `login`/`register_pat` pages.

**Spec:** `docs/superpowers/specs/2026-05-16-frontend-next-register-role-selection-design.md`

**Testing note:** This repo has **no test runner** (root `CLAUDE.md`, `frontend-next/AGENTS.md`). User instruction overrides the TDD default. Verification per task is `npx tsc --noEmit` (exit 0); final task adds `npm run build` (exit 0) + a manual smoke test with the backend running. Do **not** add a test framework.

**Pre-flight:** Branch `patient/abduvoris` (already checked out). These are already true and need no change: `frontend-next/lib/paths.ts` defines `registerPat: '/register_pat'`, `registrDoc: '/register_doc'`, `menu: '/menu'`, `patientHome: '/home'`; `frontend-next/public/assets/img/icons/logo-icon1.png` exists; `@/store/hooks` exports `useAppDispatch`; `@/store/slices/userSlice` exports `setUser`; `@/components/Shared/Toast` exports `toast`; `@/i18n/navigation` exports `Link` and `useRouter` (with `.push`/`.replace`); the Login page's register link already targets `paths.registerPat` (no change needed). Backend `/auth/register` already accepts `role: 'dentist'` (the Vite app posts it today) — no backend change.

---

### Task 1: Create the shared `RegisterView` component

**Files:**
- Create: `frontend-next/components/Auth/RegisterView.tsx`

This is the Vite `frontend/src/Pages/Register1.tsx` ported faithfully. Transformations vs. the Vite original: gains `'use client'`; `useNavigate`→`useRouter` from `@/i18n/navigation`; `useDispatch`→`useAppDispatch`; `../interfaces` types → a local `RegisterFormData`; `import LogoIcon`→ string path `/assets/img/icons/logo-icon1.png` rendered with `<img>` + an eslint-disable comment; the Vite `LockKeyholeShim` is dropped in favour of the real `LockKeyhole` lucide icon (frontend-next's `register_pat` already imports it successfully); the role is the `role` **prop** (no `selectedRole` state, no "Выберите роль" guard, no `!selectedRole` disabled state); selector buttons navigate (`router.push`) to the other route; `<Link to=>`→`<Link href=>`; the Vite demo/`!useAPI` branch is dropped (the Next port is API-only, like the current `register_pat`).

- [ ] **Step 1: Create `frontend-next/components/Auth/RegisterView.tsx`**

```tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, LockKeyhole, Mail, Phone, Stethoscope, User, UserRound } from 'lucide-react';

import { Link, useRouter } from '@/i18n/navigation';
import api from '@/api/api';
import { paths } from '@/lib/paths';
import { setUser } from '@/store/slices/userSlice';
import { useAppDispatch } from '@/store/hooks';
import { toast } from '@/components/Shared/Toast';

interface RegisterViewProps {
  role: 'patient' | 'dentist';
}

interface RegisterFormData {
  full_name: string;
  phone: string;
  email?: string;
  password: string;
}

export default function RegisterView({ role }: RegisterViewProps) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>();

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      const result = await api.post('/auth/register', {
        full_name: data.full_name,
        phone: data.phone.replace(/\s+/g, ''),
        email: data.email || '',
        password: data.password,
        role,
      });

      const accessToken = result.data.access_token;
      localStorage.setItem('access_token', accessToken);

      try {
        const meResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        const userData = meResponse.data;
        localStorage.setItem('user_data', JSON.stringify(userData));
        dispatch(setUser(userData));
      } catch {
        const fallbackUser = {
          full_name: data.full_name,
          phone: data.phone.replace(/\s+/g, ''),
          role,
        };
        localStorage.setItem('user_data', JSON.stringify(fallbackUser));
        dispatch(setUser(fallbackUser));
      }

      if (role === 'patient') {
        localStorage.setItem('is_first_time', 'true');
        router.replace(paths.patientHome);
      } else {
        router.replace(paths.menu);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      toast.error(detail || 'Ошибка регистрации');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#5d6dff] text-white">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1600&q=80')",
        }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(109,131,255,0.88),rgba(80,98,238,0.84)_38%,rgba(106,90,225,0.80)_70%,rgba(139,84,214,0.74))]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.14),transparent_30%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <div className="w-full max-w-[980px] rounded-[40px] border border-white/25 bg-white/10 px-6 py-8 shadow-[0_30px_90px_rgba(39,45,116,0.35)] backdrop-blur-[18px] sm:px-10 sm:py-10">
          <div className="grid items-start gap-8 lg:grid-cols-[0.92fr_1.08fr]">
            <section className="text-center lg:text-left">
              <div className="mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur-md lg:mx-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/assets/img/icons/logo-icon1.png" alt="GoSmile icon" className="h-20 w-20 object-contain brightness-0 invert" />
              </div>
              <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                GoSmile
              </h1>
              <div className="mx-auto mt-3 h-px w-44 bg-white/80 lg:mx-0" />
              <p className="mt-4 text-4xl leading-none text-white/95" style={{ fontFamily: '"Great Vibes", cursive' }}>
                Создайте аккаунт
              </p>
              <p className="mx-auto mt-6 max-w-md text-base leading-7 text-white/82 lg:mx-0" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                Выберите роль, заполните данные и начните пользоваться GoSmile в нужном режиме.
              </p>
            </section>

            <section>
              <div className="rounded-[32px] border border-white/20 bg-white/92 p-6 text-[#18213d] shadow-[0_18px_50px_rgba(27,31,92,0.22)] sm:p-8">
                <div className="mb-6">
                  <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#7080ff]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    Register
                  </p>
                  <h2 className="mt-2 text-3xl font-bold text-[#141b33]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                    Регистрация
                  </h2>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      Выберите роль
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => router.push(paths.registrDoc)}
                        className={`rounded-[24px] border p-4 text-left transition-all ${
                          role === 'dentist'
                            ? 'border-[#7080ff] bg-[#eef1ff] text-[#5667ff]'
                            : 'border-[#d9def7] bg-white text-[#6f789a] hover:border-[#c5cdf4]'
                        }`}
                      >
                        <Stethoscope size={24} className="mb-3" />
                        <p className="text-base font-semibold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                          Врач
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => router.push(paths.registerPat)}
                        className={`rounded-[24px] border p-4 text-left transition-all ${
                          role === 'patient'
                            ? 'border-[#7080ff] bg-[#eef1ff] text-[#5667ff]'
                            : 'border-[#d9def7] bg-white text-[#6f789a] hover:border-[#c5cdf4]'
                        }`}
                      >
                        <User size={24} className="mb-3" />
                        <p className="text-base font-semibold" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                          Пациент
                        </p>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      Полное имя
                    </label>
                    <div className={`flex items-center rounded-2xl border bg-white px-4 ${errors.full_name ? 'border-red-400' : 'border-[#d9def7]'}`}>
                      <UserRound size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type="text"
                        placeholder="Иван Иванов"
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('full_name', {
                          required: 'Введите полное имя',
                          minLength: { value: 2, message: 'Минимум 2 символа' },
                        })}
                      />
                    </div>
                    {errors.full_name && <p className="mt-1.5 text-sm text-red-500">{errors.full_name.message}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      Номер телефона
                    </label>
                    <div className={`flex items-center rounded-2xl border bg-white px-4 ${errors.phone ? 'border-red-400' : 'border-[#d9def7]'}`}>
                      <Phone size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type="tel"
                        placeholder="+998 90 123 45 67"
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('phone', {
                          required: 'Введите номер телефона',
                          validate: (value) => {
                            const cleaned = value.replace(/\s+/g, '');
                            return /^\+998\d{9}$/.test(cleaned) || 'Неверный формат номера';
                          },
                        })}
                      />
                    </div>
                    {errors.phone && <p className="mt-1.5 text-sm text-red-500">{errors.phone.message}</p>}
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      Email <span className="text-[#99a2c7]">(необязательно)</span>
                    </label>
                    <div className="flex items-center rounded-2xl border border-[#d9def7] bg-white px-4">
                      <Mail size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type="email"
                        placeholder="example@mail.com"
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('email')}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#3d4a73]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                      Пароль
                    </label>
                    <div className={`flex items-center rounded-2xl border bg-white px-4 ${errors.password ? 'border-red-400' : 'border-[#d9def7]'}`}>
                      <LockKeyhole size={18} className="mr-3 text-[#7080ff]" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Введите пароль"
                        className="w-full bg-transparent py-3.5 text-base text-[#18213d] outline-none placeholder:text-[#99a2c7]"
                        style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                        {...register('password', {
                          required: 'Введите пароль',
                          minLength: { value: 6, message: 'Минимум 6 символов' },
                        })}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((prev) => !prev)}
                        className="ml-3 text-[#7080ff] transition hover:text-[#4f60ff]"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {errors.password && <p className="mt-1.5 text-sm text-red-500">{errors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full rounded-full bg-[linear-gradient(135deg,#ffffff_0%,#eef1ff_100%)] px-6 py-3.5 text-xl font-bold text-[#5667ff] shadow-[0_16px_40px_rgba(30,35,94,0.12)] transition-transform duration-200 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                    style={{ fontFamily: '"Space Grotesk", sans-serif' }}
                  >
                    {isLoading ? 'Регистрация...' : 'Зарегистрироваться'}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-[#5f6a92]" style={{ fontFamily: '"Space Grotesk", sans-serif' }}>
                  Уже есть аккаунт?{' '}
                  <Link href={paths.login} className="font-semibold text-[#5667ff] transition hover:text-[#3f52ff]">
                    Войти
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0, no output. (If `useRouter().push`/`.replace` type-errors, it will not — `register_pat/page.tsx` already calls `router.replace` from the same `@/i18n/navigation` import; do not change the navigation module.)

- [ ] **Step 3: Commit**

```bash
git add frontend-next/components/Auth/RegisterView.tsx
git -c commit.gpgsign=false commit -m "feat(frontend-next): shared RegisterView with Пациент/Врач selector

Port of Vite Register1.tsx; role is a prop, selector buttons navigate
between /register_pat and /register_doc.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 2: Wire the `/register_pat` and `/register_doc` routes

**Files:**
- Modify: `frontend-next/app/[locale]/(public)/register_pat/page.tsx` (full replace)
- Create: `frontend-next/app/[locale]/(public)/register_doc/page.tsx`

`register_pat/page.tsx` currently holds a standalone patient-only form plus a
local `Field` helper. Replace the **entire file** with a thin wrapper. Create
`register_doc/page.tsx` as the same wrapper with `role="dentist"`. Both are
plain (server) components rendering the client `RegisterView` — no `'use
client'` needed on the page files (the directive lives in `RegisterView`).

- [ ] **Step 1: Replace `frontend-next/app/[locale]/(public)/register_pat/page.tsx` entirely**

```tsx
import RegisterView from '@/components/Auth/RegisterView';

export default function RegisterPatientPage() {
  return <RegisterView role="patient" />;
}
```

- [ ] **Step 2: Create `frontend-next/app/[locale]/(public)/register_doc/page.tsx`**

```tsx
import RegisterView from '@/components/Auth/RegisterView';

export default function RegisterDoctorPage() {
  return <RegisterView role="dentist" />;
}
```

- [ ] **Step 3: Type-check**

Run: `cd frontend-next && npx tsc --noEmit`
Expected: exit code 0, no output.

- [ ] **Step 4: Commit**

```bash
git add "frontend-next/app/[locale]/(public)/register_pat/page.tsx" "frontend-next/app/[locale]/(public)/register_doc/page.tsx"
git -c commit.gpgsign=false commit -m "feat(frontend-next): /register_pat + /register_doc render shared RegisterView

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

### Task 3: Build verification + manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Production build**

Run: `cd frontend-next && npm run build`
Expected: exit code 0, `✓ Compiled successfully`. In the route table confirm
`/[locale]/register_doc` is listed as SSG `●` with the four locale children
(`/uz/register_doc`, `/ru/register_doc`, `/en/register_doc`,
`/kz/register_doc`), and `/[locale]/register_pat` still SSG `●`. Total static
pages **63 → 67**. No new warnings.

- [ ] **Step 2: Manual smoke test**

Terminal 1: `cd backend && python run.py`
Terminal 2: `cd frontend-next && npm run dev`

In a browser:
1. Open `/uz/login` → click "Зарегистрироваться" → URL is `/uz/register_pat`,
   the **Пациент** card is highlighted (active style), **Врач** is not.
2. Click **Врач** → URL becomes `/uz/register_doc` (locale preserved), **Врач**
   is now highlighted, form is unchanged.
3. Fill the form and submit as a doctor → account is created and the app lands
   on `/uz/menu` (working doctor dashboard).
4. Go back to `/uz/register_pat`, register a different phone as a patient →
   lands on `/uz/home`; `localStorage.is_first_time === 'true'`.
5. Invalid phone (e.g. `12345`) shows "Неверный формат номера"; empty password
   shows "Введите пароль"; a duplicate phone shows the backend `detail` via a
   toast.

- [ ] **Step 3: No commit**

This task only verifies. If the build fails or the smoke test reveals a
regression, fix it under the relevant earlier task and re-run Steps 1–2.

---

## Out of scope

- Patient-flow pages and the Vite `patient → /doctors` post-register redirect (Phase 3).
- Converting the hardcoded Russian strings to `next-intl` messages.
- Any change to the Login page or the `(auth)/role` page.
- The unported Vite `PrivacySettings` form (tracked separately).

## Self-Review

- **Spec coverage:** RegisterView component with prop-driven role + navigating
  selector + faithful Vite layout (Task 1); both routes as thin wrappers, with
  `register_pat` fully replaced (Task 2); build shows new `register_doc` route +
  manual smoke covering toggle/redirects/validation (Task 3). Decisions 1–3 from
  the spec are all implemented (full port; selector navigates between routes,
  active state from prop; dentist→/menu, patient→/home+is_first_time).
- **Placeholder scan:** none — every file is given complete; no "similar to",
  no TODO, no vague error handling (the `catch`/`finally` is concrete).
- **Type consistency:** `RegisterViewProps.role: 'patient' | 'dentist'` is the
  single role type — produced by both page wrappers (`"patient"` / `"dentist"`),
  consumed for selector-active comparison, the `/auth/register` payload, the
  fallback user, and the redirect branch. `RegisterFormData` matches the
  `register('full_name'|'phone'|'email'|'password')` calls. `Link href=` /
  `useRouter().push|replace` match the `@/i18n/navigation` API already used by
  `register_pat`.
