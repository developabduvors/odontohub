"use client";

import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useTelegram } from '@/hooks/useTelegram';
import api from '@/api/api';
import { setUser } from '@/store/slices/userSlice';

export function TelegramAuthWrapper({ children }: { children: React.ReactNode }) {
    const { initData, tg, isReady } = useTelegram();
    const dispatch = useDispatch();
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState<string | null>(null);
    // Telegram ichida, ammo akkaunt hali bog'lanmagan (404) — login formasi o'rniga
    // "botda raqamingizni ulashing" ekranini ko'rsatamiz.
    const [needsContact, setNeedsContact] = useState(false);

    useEffect(() => {
        if (!isReady) return;

        if (!initData) {
            setLoading(false);
            return;
        }

        const autoLogin = async () => {
            // Extract invite token from start_param if present (format: invite_TOKEN)
            const startParam = tg?.initDataUnsafe?.start_param;
            let inviteToken: string | undefined;
            if (startParam && startParam.startsWith('invite_')) {
                inviteToken = startParam.substring('invite_'.length);
            }

            try {
                const result = await api.post('/api/telegram/login', {
                    init_data: initData,
                    invite_token: inviteToken || undefined
                });
                const { access_token } = result.data;

                localStorage.setItem('access_token', access_token);

                const meResponse = await api.get('/auth/me', {
                    headers: { Authorization: `Bearer ${access_token}` },
                });

                const userData = meResponse.data;
                localStorage.setItem('user_data', JSON.stringify(userData));
                dispatch(setUser(userData));
            } catch (err: any) {
                console.log("Telegram auth not linked yet or failed:", err);
                const detail = err.response?.data?.detail;
                if (inviteToken && detail) {
                    // Invite oqimidagi xato (yaroqsiz/muddati tugagan) — ekranda ko'rsatamiz.
                    setAuthError(detail);
                } else {
                    // Oddiy bog'lanmagan holat — bot orqali raqam ulashishni so'raymiz (parolsiz kirish).
                    try {
                        await api.post('/api/telegram/request-link', { init_data: initData });
                    } catch {
                        /* bot xabarini yuborib bo'lmasa ham, foydalanuvchini botga yo'naltiramiz */
                    }
                    // Login formasi o'rniga botga raqam ulashish ekranini ko'rsatamiz.
                    setNeedsContact(true);
                }
            } finally {
                setLoading(false);
            }
        };

        autoLogin();
    }, [initData, tg, isReady, dispatch]);

    if (authError) {
        const getErrorMessage = (detail: string) => {
            switch (detail) {
                case 'Инвайт-код недействителен.':
                    return {
                        uz: 'Taklif havolasi yaroqsiz yoki eskirgan.',
                        ru: 'Ссылка-приглашение недействительна или устарела.'
                    };
                case 'Срок действия приглашения истек.':
                    return {
                        uz: 'Taklif havolasining muddati tugagan.',
                        ru: 'Срок действия приглашения истек.'
                    };
                case 'Этот Telegram-аккаунт уже привязан к другому пользователю.':
                    return {
                        uz: 'Ushbu Telegram-hisob boshqa foydalanuvchiga ulangan.',
                        ru: 'Этот Telegram-аккаунт уже привязан к другому пользователю.'
                    };
                case 'У этого пациента уже привязан другой Telegram-аккаунт.':
                    return {
                        uz: 'Ushbu bemorga boshqa Telegram-hisob ulangan.',
                        ru: 'У этого пациента уже привязан другой Telegram-аккаунт.'
                    };
                default:
                    return {
                        uz: detail,
                        ru: detail
                    };
            }
        };

        const msg = getErrorMessage(authError);

        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center shadow-lg border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-5 shrink-0">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1f36] mb-3">Xatolik / Ошибка</h3>
                    <div className="text-gray-500 font-medium text-sm mb-6 leading-relaxed space-y-2">
                        <p>{msg.uz}</p>
                        <hr className="border-gray-100 my-2" />
                        <p>{msg.ru}</p>
                    </div>
                    <button
                        onClick={() => {
                            if (tg) tg.close();
                            else window.close();
                        }}
                        className="w-full py-4 bg-[#1a1f36] text-white font-bold rounded-[22px] hover:bg-[#2c3545] transition-all active:scale-[0.98]"
                    >
                        Yopish / Закрыть
                    </button>
                </div>
            </div>
        );
    }

    if (needsContact) {
        const BOT_URL = 'https://t.me/gosmileuz_bot';
        const openBot = () => {
            // Mini App ichida bot chatини ochish — u yerда "raqam ulashish" tugmasi turadi.
            if (tg?.openTelegramLink) tg.openTelegramLink(BOT_URL);
            else window.open(BOT_URL, '_blank');
        };
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 p-6">
                <div className="bg-white w-full max-w-sm rounded-[32px] p-8 text-center shadow-lg border border-gray-100 flex flex-col items-center">
                    <div className="w-16 h-16 bg-[#5d6dff]/10 rounded-full flex items-center justify-center mb-5 shrink-0">
                        <svg className="w-8 h-8 text-[#5d6dff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-[#1a1f36] mb-3">Kirish / Вход</h3>
                    <div className="text-gray-500 font-medium text-sm mb-6 leading-relaxed space-y-2">
                        <p>Kirish uchun botда telefon raqamingizni ulashing.</p>
                        <hr className="border-gray-100 my-2" />
                        <p>Чтобы войти, поделитесь номером телефона в боте.</p>
                    </div>
                    <button
                        onClick={openBot}
                        className="w-full py-4 bg-[#5d6dff] text-white font-bold rounded-[22px] hover:bg-[#4a5ae0] transition-all active:scale-[0.98]"
                    >
                        Botni ochish / Открыть бота
                    </button>
                </div>
            </div>
        );
    }

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
