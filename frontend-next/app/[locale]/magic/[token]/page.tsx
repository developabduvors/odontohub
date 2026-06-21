'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Loader2, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter, Link } from '@/i18n/navigation';
import api from '@/api/api';
import { paths } from '@/lib/paths';
import { setUser } from '@/store/slices/userSlice';
import { useAppDispatch } from '@/store/hooks';

// Magic-havola: token URL'da keladi. Uni sessiya tokeni sifatida saqlab,
// /auth/me orqali user_data ni olamiz va bemorni avtomatik tizimga kiritamiz.
export default function MagicLoginPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations();
    const dispatch = useAppDispatch();
    const [error, setError] = useState(false);

    useEffect(() => {
        const raw = params?.token;
        const token = Array.isArray(raw) ? raw[0] : raw;
        if (!token) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- this effect only runs once on mount
            setError(true);
            return;
        }

        let cancelled = false;
        (async () => {
            try {
                localStorage.setItem('access_token', token);
                const me = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (cancelled) return;
                const userData = me.data;
                localStorage.setItem('user_data', JSON.stringify(userData));
                dispatch(setUser(userData));
                router.replace(userData.role === 'patient' ? paths.patientHome : paths.menu);
            } catch {
                if (cancelled) return;
                // Yaroqsiz yoki muddati o'tgan havola
                localStorage.removeItem('access_token');
                localStorage.removeItem('user_data');
                setError(true);
            }
        })();

        return () => { cancelled = true; };
    }, [params, router, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#5d6dff] p-6">
            <div className="bg-white rounded-[28px] px-8 py-10 max-w-sm w-full text-center shadow-2xl">
                {error ? (
                    <>
                        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                        <h1 className="text-xl font-black text-[#1a1f36] mb-2">
                            {t('magic.error_title')}
                        </h1>
                        <p className="text-gray-500 font-medium mb-6">{t('magic.error_desc')}</p>
                        <Link
                            href={paths.login}
                            className="inline-block w-full py-3 bg-[#4f6bff] text-white font-bold rounded-[16px] hover:bg-[#3d56d5] transition-all"
                        >
                            {t('magic.go_login')}
                        </Link>
                    </>
                ) : (
                    <>
                        <Loader2 className="w-12 h-12 text-[#4f6bff] mx-auto mb-4 animate-spin" />
                        <h1 className="text-xl font-black text-[#1a1f36] mb-2">
                            {t('magic.loading_title')}
                        </h1>
                        <p className="text-gray-500 font-medium">{t('magic.loading_desc')}</p>
                    </>
                )}
            </div>
        </div>
    );
}
