'use client';

import { useEffect } from 'react';
import { useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import { isAuthenticated, getUserRole } from '@/utils/auth';

/**
 * Allaqachon kirgan foydalanuvchini kirish sahifalaridan (login, register,
 * welcome) avtomatik home'ga yo'naltiradi — shu qurilmada qayta login
 * qilmasligi uchun. Token localStorage'da turadi; muddati o'tgan bo'lsa
 * home'dagi API 401 qaytaradi va api.ts interceptori /login'ga qaytaradi.
 */
export function useRedirectIfAuthed() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) return;
    const role = getUserRole();
    router.replace(role === 'patient' ? paths.patientHome : paths.menu);
  }, [router]);
}
