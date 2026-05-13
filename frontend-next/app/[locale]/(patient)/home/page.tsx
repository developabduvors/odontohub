'use client';

import { useAppSelector } from '@/store/hooks';

export default function PatientHomePage() {
  const user = useAppSelector((s) => s.user.user);

  return (
    <div>
      <h1 className="text-3xl font-bold">Patient Home</h1>
      <p className="mt-2 text-slate-600">
        Welcome, {user?.full_name || user?.first_name || user?.name || 'Patient'}!
      </p>
      <p className="mt-4 text-sm text-slate-500">
        (Phase 1 stub — full home UI is ported in Phase 2)
      </p>
    </div>
  );
}
