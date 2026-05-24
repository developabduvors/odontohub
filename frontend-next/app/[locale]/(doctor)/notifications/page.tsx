'use client';

import { useState, useEffect } from 'react';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import { getNotifications, markAsRead, markAllAsRead, deleteAllNotifications } from '@/api/notifications';
import type { Notification } from '@/api/notifications';

const NOTIF_LOGO = '/assets/img/icons/NotifLogo.svg';

const typeLabels: Record<string, string> = {
    appointment_confirmed: 'Qabul tasdiqlandi',
    appointment_cancelled: 'Qabul bekor qilindi',
    appointment_reminder: 'Eslatma',
    payment_received: "To'lov qabul qilindi",
    review_received: 'Yangi baho',
    profile_approved: 'Profil tasdiqlandi',
    profile_rejected: 'Profil rad etildi',
    system_message: 'Tizim xabari',
};

const NotificationsPage = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            const data = await getNotifications();
            setNotifications(data);
        } catch (err: any) {
            console.error('Notifications error:', err?.response?.status, err?.response?.data);
        } finally {
            setLoading(false);
        }
    };

    const handleClick = async (n: Notification) => {
        if (!n.is_read) {
            await markAsRead(n.id);
            setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, is_read: true } : x));
        }
    };

    const handleMarkAll = async () => {
        await markAllAsRead();
        setNotifications(prev => prev.map(x => ({ ...x, is_read: true })));
    };

    const handleDeleteAll = async () => {
        if (notifications.length === 0) return;

        const confirmed = window.confirm("Barcha bildirishnomalarni o'chirishni tasdiqlaysizmi?");
        if (confirmed) {
            try {
                await deleteAllNotifications();
                setNotifications([]);
            } catch (err) {
                console.error("Delete all error:", err);
            }
        }
    };

    const formatTime = (dateString: string) => {
        // Ensure UTC parsing - add Z if not present
        const utcString = dateString.endsWith('Z') || dateString.includes('+') ? dateString : dateString + 'Z';
        const date = new Date(utcString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const mins = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        if (mins < 1) return 'Hozir';
        if (mins < 60) return `${mins} daqiqa oldin`;
        if (hours < 24) return `${hours} soat oldin`;
        return `${days} kun oldin`;
    };

    const unreadCount = notifications.filter(n => !n.is_read).length;

    return (
        <div className="min-h-screen bg-[#f5f7fb] flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-5 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.back()}
                        className="w-10 h-10 flex items-center justify-center bg-[#1D1D2B] rounded-full"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                            <path d="M15 18L9 12L15 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-[#1D1D2B]">Bildirishnomalar</h1>
                        {unreadCount > 0 && (
                            <p className="text-xs text-gray-400">{unreadCount} ta o&apos;qilmagan</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                        <button
                            onClick={handleMarkAll}
                            className="flex items-center gap-1.5 px-4 py-2 bg-[#f0f4ff] text-[#5377f7] rounded-2xl text-sm font-bold hover:bg-[#e0e8ff] transition"
                        >
                            <CheckCheck size={16} />
                            Hammasini o&apos;qildi
                        </button>
                    )}
                    {notifications.length > 0 && (
                        <button
                            onClick={handleDeleteAll}
                            className="flex items-center justify-center w-10 h-10 bg-[#fff1f1] text-[#ff4d4d] rounded-2xl hover:bg-[#ffe4e4] transition"
                            title="Hammasini o'chirish"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>

            {/* List */}
            <div className="flex-1 p-4 space-y-3 max-w-2xl mx-auto w-full">
                {loading && (
                    <div className="flex justify-center py-20">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#5377f7]" />
                    </div>
                )}

                {!loading && notifications.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-24 gap-4">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center">
                            <Bell size={36} className="text-gray-300" />
                        </div>
                        <p className="text-gray-400 font-bold text-lg">Bildirishnomalar yo&apos;q</p>
                    </div>
                )}

                {!loading && notifications.map((n) => (
                    <div
                        key={n.id}
                        onClick={() => handleClick(n)}
                        className={`rounded-[24px] p-4 flex items-start gap-4 cursor-pointer transition-all active:scale-[0.98] ${
                            n.is_read ? 'bg-white' : 'bg-[#eef2ff] border border-[#c7d2fe]'
                        }`}
                    >
                        <div className="relative shrink-0">
                            <div className="w-12 h-12 rounded-full bg-[#5377f7] flex items-center justify-center p-2.5">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={NOTIF_LOGO} alt="" className="w-full h-full object-contain" />
                            </div>
                            {!n.is_read && (
                                <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#11D76A] rounded-full border-2 border-white" />
                            )}
                        </div>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2 mb-0.5">
                                <span className="text-xs font-bold text-[#5377f7] uppercase tracking-wide">
                                    {typeLabels[n.type] || n.type}
                                </span>
                                <span className="text-xs text-gray-400 shrink-0">{formatTime(n.created_at)}</span>
                            </div>
                            <h3 className={`text-sm font-black text-[#1D1D2B] mb-0.5 ${!n.is_read ? '' : 'font-bold'}`}>
                                {n.title}
                            </h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{n.message}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationsPage;
