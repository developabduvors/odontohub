'use client';

import { useEffect, type ReactNode } from 'react';
import { useAppDispatch } from '@/store/hooks';
import { setUser } from '@/store/slices/userSlice';

export function AuthInit({ children }: { children: ReactNode }) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const userRaw = localStorage.getItem('user_data');
    if (token && userRaw) {
      try {
        dispatch(setUser(JSON.parse(userRaw)));
      } catch {
        // noto'g'ri JSON — e'tiborsiz
      }
    }
  }, [dispatch]);

  return <>{children}</>;
}
