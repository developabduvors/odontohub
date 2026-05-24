'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { useRouter } from '@/i18n/navigation';

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
      router.replace('/role');
      return;
    }
    setReady(true);
  }, [requiredRole, router]);

  if (!ready) return null;
  return <>{children}</>;
}
