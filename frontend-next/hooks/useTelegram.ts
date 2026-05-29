"use client";

import { useEffect, useState } from 'react';

// Define the shape of Telegram's global object for TypeScript
declare global {
    interface Window {
        Telegram?: {
            WebApp: any;
        };
    }
}

export function useTelegram() {
    const [initData, setInitData] = useState<string>('');
    const [user, setUser] = useState<any>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        // Only run on client-side and if we're actually in Telegram
        if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initData) {
            const tg = window.Telegram.WebApp;

            // Expand the web view to maximum available height
            tg.expand();

            // Let Telegram know the app is fully loaded
            tg.ready();

            setInitData(tg.initData);

            // tg.initDataUnsafe contains user info parsed locally (useful for UI, though not secure for auth)
            if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
                setUser(tg.initDataUnsafe.user);
            }

            setIsReady(true);
        } else {
            setIsReady(true);
        }
    }, []);

    return {
        tg: typeof window !== 'undefined' ? window.Telegram?.WebApp : null,
        initData,
        user,
        isReady,
        close: () => {
            if (typeof window !== 'undefined') {
                window.Telegram?.WebApp.close();
            }
        },
    };
}
