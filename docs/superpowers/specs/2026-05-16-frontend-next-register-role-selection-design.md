# Register role selection (Пациент/Врач) — frontend-next port — Design

**Date:** 2026-05-16
**Branch:** `patient/abduvoris`
**Status:** Approved (design), spec for implementation planning

## Problem / Gap

The Vite frontend (`frontend/`) registration screen lets the user pick a role
(**Врач** / **Пациент**) before filling the form. The Next.js port
(`frontend-next/`) dropped this: its register page is hardcoded to patients.

| | Vite `frontend/` (`src/Pages/Register1.tsx`) | `frontend-next/` (`app/[locale]/(public)/register_pat/page.tsx`) |
|---|---|---|
| Role choice | Врач / Пациент selector at top of form | none — hardcoded `role: 'patient'` |
| Layout | 2-column hero + glass card | compact single card |
| After register | patient → `/doctors` (+`is_first_time`); dentist → `/menu` | always patient → `/home` |
| Login role toggle | none — derives role from `GET /auth/me` | same (already faithful) ✅ |

The role choice only ever existed on the **register** page in Vite (login
correctly derives role from the backend). So this work is scoped to register.

## Decisions (locked with user)

1. **Approach:** Full faithful port of Vite `Register1.tsx`, **plus** split into
   two routes: `/register_pat` and `/register_doc` (`paths.registrDoc` already
   exists in `lib/paths.ts` but has no page).
2. **Route split mechanics:** One shared `RegisterView` component. The
   Врач/Пациент selector **navigates between the two routes** (URL always
   reflects the role, deep-linkable). Each route preselects its role via a prop;
   the selected/active state is derived from that prop, not local `useState`.
3. **Post-register redirect:** `dentist` → `/menu` (fully working doctor
   dashboard). `patient` → `/home` (existing stub; safe, no 404). The Vite
   `patient → /doctors` behaviour is intentionally deferred to Phase 3 (the
   patient flow and `/doctors` page do not exist in frontend-next yet).

## Architecture

A single client component owns the form, layout, and submit logic. The two
page files are thin role-injecting wrappers. The role is a **route fact**
(which URL you are on), passed down as a prop — there is no role state to keep
in sync, and the selector is just navigation.

```
/register_pat  (page) ──► <RegisterView role="patient" />
/register_doc  (page) ──► <RegisterView role="dentist" />
                                   │
                                   ├─ selector "Врач"    → router.push(paths.registrDoc)
                                   ├─ selector "Пациент" → router.push(paths.registerPat)
                                   └─ submit → POST /auth/register {role} → /auth/me
                                              → dentist: /menu | patient: /home
```

### Component: `components/Auth/RegisterView.tsx` (NEW)

- Directive: `'use client'` (uses `useForm`, `useState`, `useRouter`).
- Props: `{ role: 'patient' | 'dentist' }`.
- Visual: 1:1 port of Vite `Register1.tsx` — full-screen gradient background,
  2-column layout (`lg:grid-cols-[0.92fr_1.08fr]`), left hero (GoSmile logo +
  tagline), right glass card containing the role selector + form.
- Form: `react-hook-form`, fields `full_name`, `phone`, `email` (optional),
  `password`; show/hide password toggle; same validation rules as Vite
  (`phone` → `/^\+998\d{9}$/` after stripping spaces; `password` min 6;
  `full_name` min 2).
- Strings: **hardcoded Russian**, identical to the Vite source. No `next-intl`
  keys are introduced (consistent with the existing `login` and `register_pat`
  pages, and avoids next-intl missing-key runtime errors).
- Role selector: two buttons (Врач with `Stethoscope`, Пациент with `User`).
  Active styling when its role === the `role` prop. `onClick`:
  - Врач → `router.push(paths.registrDoc)`
  - Пациент → `router.push(paths.registerPat)`
  Submit is never role-gated (a role is always implied by the route), so the
  Vite "Выберите роль" guard and `!selectedRole` disabled state are dropped.
- "Уже есть аккаунт? Войти" link → `paths.login` (via `@/i18n/navigation` `Link`).
- Imports: `@/i18n/navigation` (`Link`, `useRouter`), `@/api/api`,
  `@/store/hooks` (`useAppDispatch`), `@/store/slices/userSlice` (`setUser`),
  `@/components/Shared/Toast` (`toast`), `@/lib/paths`, `lucide-react`,
  `react-hook-form`.

### Data flow (submit)

Faithful to Vite `Register1.tsx` `onSubmit` (the `useAPI` branch only — the
Next port has no demo/localStorage-mock branch):

1. `setIsLoading(true)`.
2. `api.post('/auth/register', { full_name, phone: phone.replace(/\s+/g,''),
   email: email || '', password, role })` where `role` is the prop.
3. `localStorage.setItem('access_token', result.data.access_token)`.
4. `GET /auth/me` with `Authorization: Bearer <token>`; on success store
   `user_data` + `dispatch(setUser(userData))`. On failure, build a fallback
   user `{ full_name, phone, role }`, store + dispatch it (mirrors Vite).
5. Redirect:
   - `dentist` → `router.replace(paths.menu)`
   - `patient` → `localStorage.setItem('is_first_time','true')` →
     `router.replace(paths.patientHome)` (`/home`)
6. Errors: `catch` → `toast.error(err?.response?.data?.detail || 'Ошибка
   регистрации')`. `finally` → `setIsLoading(false)`.

`localStorage` is touched only inside the submit handler (a client-only event
handler), so the component is SSR-safe with no `typeof window` guards needed.

### Page wrappers

- `app/[locale]/(public)/register_pat/page.tsx` — **replace** the current
  inline patient-only form (and its local `Field` helper) with:
  `import RegisterView from '@/components/Auth/RegisterView';`
  `export default function RegisterPatientPage() { return <RegisterView role="patient" />; }`
- `app/[locale]/(public)/register_doc/page.tsx` — **new**, same shape with
  `role="dentist"`.

Both live in the existing `(public)` route group, which has **no** layout file
and no auth guard (public, pre-login) — matching the current `register_pat`.

## Unchanged / not touched

- **Backend:** `/auth/register` already accepts `role: 'dentist'` (the Vite app
  posts it today); `userrole` enum is `patient | dentist`. No backend change.
- **Login page:** its register link already points to `paths.registerPat`
  (the patient default; user toggles to doctor from there). No change.
- **`lib/paths.ts`:** both `registerPat: '/register_pat'` and
  `registrDoc: '/register_doc'` already defined. No change.
- **`(auth)/role/page.tsx`:** the manual demo role navigator is unrelated and
  left as-is.

## Verification

No test runner exists in this repo (root `CLAUDE.md`, `frontend-next/AGENTS.md`)
— user instruction overrides the TDD default; do not add a test framework.

- `cd frontend-next && npx tsc --noEmit` → exit 0.
- `cd frontend-next && npm run build` → exit 0. Expect a new route
  `/[locale]/register_doc` (SSG `●`, ×4 locales). Total static pages
  **63 → 67**; no new warnings.
- Manual smoke (backend running, `npm run dev`, browser):
  1. From Login → "Зарегистрироваться" lands on `/<loc>/register_pat`,
     selector shows **Пациент** active.
  2. Click **Врач** → URL becomes `/<loc>/register_doc`, **Врач** active,
     same form.
  3. Register a doctor → lands on `/menu` (working dashboard).
  4. Register a patient (toggle back) → lands on `/home`.
  5. Locale prefix is preserved across the toggle (next-intl navigation).

## Out of scope

- Patient-flow pages and the Vite `patient → /doctors` post-register redirect
  (Phase 3).
- Converting these hardcoded Russian strings to `next-intl` messages.
- The unported Vite `PrivacySettings` form (tracked separately).
- Any change to Login or the `(auth)/role` page.

## Self-Review

- **Placeholders:** none — every file's content and behaviour is specified.
- **Consistency:** the `role` prop type (`'patient' | 'dentist'`) is produced
  by both page wrappers and consumed for both selector-active state and the
  `/auth/register` payload; redirects are exhaustive over the two roles.
- **Scope:** single shared component + two thin pages — one focused
  implementation plan.
- **Ambiguity:** "role" is always the route's role (prop), never local state;
  selector clicks are navigation only — stated explicitly to remove the
  Vite in-page-`useState` interpretation.
