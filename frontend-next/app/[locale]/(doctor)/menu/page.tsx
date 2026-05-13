'use client';

import { useAppSelector } from '@/store/hooks';

export default function MenuPage() {
  const user = useAppSelector((s) => s.user.user);

  return (
    <div>
      <h1 className="text-3xl font-bold">Doctor Menu</h1>
      <p className="mt-2 text-slate-600">
        Welcome, {user?.full_name || user?.first_name || user?.name || 'Doctor'}!
      </p>
      <p className="mt-4 text-sm text-slate-500">
        (Phase 1 stub — full menu UI is ported in Phase 2)
      </p>
    </div>
  );
}
