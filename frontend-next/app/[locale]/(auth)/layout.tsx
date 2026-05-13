import type { ReactNode } from 'react';
import { RoleGuard } from '@/guards/RoleGuard';

// Token mavjud, lekin rol hali tanlanmagan foydalanuvchilar uchun.
// RoleGuard ni requiredRole bermay ishlatamiz — bu token tekshiradi,
// lekin rolni solishtirmaydi.
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <RoleGuard>{children}</RoleGuard>;
}
