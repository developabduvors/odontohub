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
