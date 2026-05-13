'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/userSlice';

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
          {items.map((it) => {
            const active = pathname?.endsWith(it.href);
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`block rounded px-3 py-2 ${active ? 'bg-blue-100 font-semibold' : 'hover:bg-slate-100'}`}
              >
                {it.label}
              </Link>
            );
          })}
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
