'use client';

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "@/components/Shared/Toast";
import { AlertTriangle, Video } from "lucide-react";
import { paths } from "@/lib/paths";
import { getToken } from "@/utils/auth";

const ActionButtons = ({ phone, doctorName }: { phone?: string; doctorName?: string }) => {
    const router = useRouter();
    const t = useTranslations();
    const { id } = useParams<{ id: string }>();
    const [showRescheduleModal, setShowRescheduleModal] = useState(false);
    const [showContactModal, setShowContactModal] = useState(false);
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [newDate, setNewDate] = useState("");
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (phone) {
            navigator.clipboard.writeText(phone);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const confirmCancel = async () => {
        const accessToken = getToken();
        const isLocalMode = accessToken?.startsWith('local_token_');

        if (isLocalMode) {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const updated = appointments.filter((app: any) => app.id.toString() !== id);
            localStorage.setItem('appointments', JSON.stringify(updated));
        } else {
            try {
                const { default: api } = await import('@/api/api');
                await api.patch(`/appointments/${id}`, { status: 'cancelled' });
            } catch (e) {
                toast.error('Отменить не удалось');
                setShowCancelModal(false);
                return;
            }
        }

        toast.success(t("patient.alerts.appointment_cancelled"));
        setShowCancelModal(false);
        router.push(paths.patientCalendar);
    };

    const confirmReschedule = () => {
        if (!newDate) {
            toast.warning(t("patient.alerts.select_new_date"));
            return;
        }

        const accessToken = getToken();
        const isLocalMode = accessToken?.startsWith('local_token_');

        if (isLocalMode) {
            const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
            const updated = appointments.map((app: any) =>
                app.id.toString() === id
                    ? { ...app, date: new Date(newDate).toLocaleDateString('ru-RU'), status: 'moved' }
                    : app
            );
            localStorage.setItem('appointments', JSON.stringify(updated));
        } else {
            try {
                const startDate = new Date(newDate);
                const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
                import('@/api/api').then(({ default: api }) => {
                    api.patch(`/appointments/${id}`, {
                        start_time: startDate.toISOString(),
                        end_time: endDate.toISOString(),
                        status: 'moved'
                    });
                });
            } catch (e) {
                toast.error('Ошибка при переносе');
                setShowRescheduleModal(false);
                return;
            }
        }

        toast.success(t("patient.alerts.appointment_rescheduled") + " " + new Date(newDate).toLocaleString('ru-RU'));
        setShowRescheduleModal(false);
        router.push(paths.patientCalendar);
    };

    return (
        <>
            <div className="flex flex-col gap-3 sm:gap-4 lg:gap-5">
                {/* Online consultation button */}
                <button
                    onClick={() => toast.info(t('patient.alerts.function_in_development'))}
                    className="w-full bg-[#4E70FF] text-white py-3 sm:py-4 lg:py-5 rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] text-sm sm:text-base lg:text-2xl font-bold shadow-lg shadow-blue-500/20 hover:bg-[#3d5ce0] transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                    <Video size={20} />
                    Онлайн консультация
                </button>
                <div className="flex gap-3 sm:gap-4 lg:gap-5">
                    <button
                        onClick={() => setShowContactModal(true)}
                        className="flex-1 bg-[#11D76A] text-white py-3 sm:py-4 lg:py-5 rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] text-sm sm:text-base lg:text-2xl font-bold shadow-lg shadow-green-500/20 hover:bg-[#0fc460] transition-all active:scale-95 flex items-center justify-center"
                    >
                        Связаться
                    </button>
                    <button
                        onClick={() => setShowRescheduleModal(true)}
                        className="flex-1 bg-[#FBBC05] text-white py-3 sm:py-4 lg:py-5 rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] text-sm sm:text-base lg:text-2xl font-bold shadow-lg shadow-yellow-500/20 hover:bg-[#e0a800] transition-all active:scale-95"
                    >
                        Перенести
                    </button>
                </div>
                <button
                    onClick={() => setShowCancelModal(true)}
                    className="w-full bg-[#EA4335] hover:bg-[#c0392b] text-white py-3 sm:py-4 lg:py-5 rounded-[16px] sm:rounded-[20px] lg:rounded-[24px] text-sm sm:text-base lg:text-2xl font-bold transition-all active:scale-95 shadow-lg shadow-red-500/30"
                >
                    Отменить
                </button>
            </div>

            {/* Cancel Confirm Modal */}
            {showCancelModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                                <AlertTriangle size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-xl font-black text-[#1D1D2B]">
                                {t("patient.appointment_detail.cancel_confirm")}
                            </h3>
                            <p className="text-gray-400 text-sm font-medium">
                                Это действие нельзя отменить
                            </p>
                        </div>
                        <div className="flex gap-3 mt-8">
                            <button
                                onClick={() => setShowCancelModal(false)}
                                className="flex-1 bg-gray-100 text-gray-700 py-3.5 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Назад
                            </button>
                            <button
                                onClick={confirmCancel}
                                className="flex-1 bg-[#EA4335] text-white py-3.5 rounded-2xl font-bold hover:bg-[#d63b2f] transition-all active:scale-95 shadow-lg shadow-red-500/20"
                            >
                                Отменить
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reschedule Modal */}
            {showRescheduleModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-2xl font-black text-gray-900 mb-6">Перенести приём</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-500 mb-2">Выберите новую дату и время</label>
                                <input
                                    type="datetime-local"
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex gap-3 mt-6">
                                <button
                                    onClick={() => setShowRescheduleModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={confirmReschedule}
                                    className="flex-1 bg-[#FBBC05] text-white py-3 rounded-xl font-bold hover:bg-[#e0a800] transition-all"
                                >
                                    Подтвердить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Contact Modal */}
            {showContactModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-[32px] p-8 max-w-md w-full shadow-2xl animate-in fade-in zoom-in duration-300">
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Связаться с врачом</h3>
                        <p className="text-gray-500 mb-6 font-medium">Выберите удобный способ связи</p>
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <span className="text-xl font-bold text-gray-900">{phone || "Номер не указан"}</span>
                                <button
                                    onClick={handleCopy}
                                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${copied ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600 hover:bg-blue-200'}`}
                                >
                                    {copied ? "Скопировано!" : "Копировать"}
                                </button>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setShowContactModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-4 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                                >
                                    Отмена
                                </button>
                                {phone && (
                                    <a
                                        href={`tel:${phone}`}
                                        className="flex-[3] bg-[#11D76A] text-white py-4 rounded-2xl font-bold hover:bg-[#0fc460] transition-all active:scale-95 flex items-center justify-center shadow-lg shadow-green-500/20 text-lg"
                                    >
                                        Позвонить
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ActionButtons;
