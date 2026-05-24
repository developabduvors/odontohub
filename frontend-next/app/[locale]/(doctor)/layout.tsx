import type { ReactNode } from 'react';
import { RoleGuard } from '@/guards/RoleGuard';
import { MainLayout } from '@/layouts/MainLayout';

export default function DoctorLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRole="dentist">
      <MainLayout>{children}</MainLayout>
    </RoleGuard>
  );
}
