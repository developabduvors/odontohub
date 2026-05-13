import type { ReactNode } from 'react';
import { RoleGuard } from '@/guards/RoleGuard';
import { PatientLayout } from '@/layouts/PatientLayout';

export default function PatientGroupLayout({ children }: { children: ReactNode }) {
  return (
    <RoleGuard requiredRole="patient">
      <PatientLayout>{children}</PatientLayout>
    </RoleGuard>
  );
}
