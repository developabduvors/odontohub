'use client';

import type { ReactNode } from 'react';
import { Link, usePathname } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { useAppDispatch } from '@/store/hooks';
import { clearUser } from '@/store/slices/userSlice';

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
      <main className="flex-1 p-4 pb-24">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 flex border-t bg-white">
        {items.map((it) => {
          const active = pathname?.endsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`flex-1 py-3 text-center text-sm ${active ? 'font-semibold text-blue-600' : 'text-slate-600'}`}
            >
              {it.label}
            </Link>
          );
        })}
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
