"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTelegram } from '@/hooks/useTelegram';
import api from '@/api/api';
import { setUser } from '@/store/slices/userSlice';

export function TelegramAuthWrapper({ children }: { children: React.ReactNode }) {
    const { initData, isReady } = useTelegram();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!isReady) return;

        if (!initData) {
            setLoading(false);
            return;
        }

        const autoLogin = async () => {
            try {
                const result = await api.post('/api/telegram/login', { init_data: initData });
                const { access_token } = result.data;

                localStorage.setItem('access_token', access_token);

                const meResponse = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${access_token}` },
                });

                const userData = meResponse.data;
                localStorage.setItem('user_data', JSON.stringify(userData));
                dispatch(setUser(userData));
            } catch (err) {
                console.log("Telegram auth not linked yet or failed");
            } finally {
                setLoading(false);
            }
        };

        autoLogin();
    }, [initData, isReady, dispatch]);

    if (!isReady || (initData && loading)) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#5d6dff]">
                <div className="flex flex-col items-center">
                    <div className="mt-4 h-8 w-8 animate-spin rounded-full border-4 border-white/30 border-t-white"></div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
