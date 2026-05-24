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
