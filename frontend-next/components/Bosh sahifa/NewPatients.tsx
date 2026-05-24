'use client';

import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import { useMyAppointments, useUpdateAppointment } from '@/api/appointments';
import { toast } from '@/components/Shared/Toast';

const NewPatients = () => {
    const t = useTranslations();
    const locale = useLocale();
    const router = useRouter();
    const { data: appointments = [], isLoading } = useMyAppointments();
    const { mutate: updateStatus, isPending: isUpdating } = useUpdateAppointment();
    const [loadingId, setLoadingId] = useState<number | null>(null);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const newPatients = appointments.filter(a => {
        if (a.status !== 'pending') return false;
        const appDate = new Date(a.start_time);
        appDate.setHours(0, 0, 0, 0);
        return appDate >= today;
    });

    if (isLoading) {
        return (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-6 shadow-sm border border-gray-50 animate-pulse">
                <div className="h-6 sm:h-8 w-36 sm:w-48 bg-gray-100 rounded-lg mb-4 sm:mb-6" />
                <div className="flex gap-3 sm:gap-4 overflow-hidden">
                    <div className="min-w-[240px] sm:min-w-[300px] h-40 sm:h-48 bg-gray-50 rounded-xl sm:rounded-2xl" />
                    <div className="min-w-[240px] sm:min-w-[300px] h-40 sm:h-48 bg-gray-50 rounded-xl sm:rounded-2xl" />
                </div>
            </div>
        );
    }

    if (newPatients.length === 0) return null;

    const handleAccept = (id: number) => {
        setLoadingId(id);
        updateStatus({ id, status: 'confirmed' }, {
            onSuccess: () => {
                toast.success(t('dashboard.new_patients.accepted_success'));
                setLoadingId(null);
            },
            onError: () => {
                toast.error(t('common.errors.something_went_wrong'));
                setLoadingId(null);
            }
        });
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
            day: 'numeric',
            month: 'long'
        });
    };

    const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8 shadow-sm border border-gray-50">
            <div className="flex justify-between items-center mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-2xl font-black text-[#1D1D2B] flex items-center gap-2 sm:gap-3">
                    {t('dashboard.new_patients.title')}
                    <span className="bg-[#1D1D2B] text-white text-xs sm:text-sm px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full font-bold">
                        {newPatients.length}
                    </span>
                </h2>
                <button
                    onClick={() => router.push('/appointments')}
                    className="p-2 sm:p-3 bg-gray-100/50 hover:bg-gray-100 rounded-full transition-all group active:scale-95"
                >
                    <ChevronRight size={18} className="sm:hidden text-gray-900 group-hover:translate-x-0.5 transition-transform" />
                    <ChevronRight size={20} className="hidden sm:block text-gray-900 group-hover:translate-x-0.5 transition-transform" />
                </button>
            </div>

            <div className="flex gap-3 sm:gap-4 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
                {newPatients.map((patient) => (
                    <div
                        key={patient.id}
                        className="min-w-[240px] sm:min-w-[320px] bg-white border border-gray-100 rounded-2xl sm:rounded-[32px] p-4 sm:p-5 shadow-xs hover:shadow-md transition-all duration-300 group"
                    >
                        <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-base sm:text-xl shadow-lg shadow-blue-500/20 shrink-0">
                                {patient.patient_name?.[0] || 'P'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-bold text-gray-900 text-base sm:text-lg truncate leading-tight">
                                    {patient.patient_name || 'Bemor'}
                                </h3>
                                <p className="text-xs sm:text-sm font-bold text-gray-400 mt-0.5">
                                    33 {t('dashboard.new_patients.age_unit')}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm mb-4 sm:mb-5 bg-gray-50 p-3 sm:p-4 rounded-xl sm:rounded-2xl">
                            <div className="flex items-center gap-2 font-bold text-gray-600">
                                <span className="bg-white p-1 rounded-md shadow-xs">📅</span>
                                <span>
                                    {formatDate(patient.start_time)} | {formatTime(patient.start_time)}
                                </span>
                            </div>

                            <div className="line-clamp-1">
                                <span className="font-bold text-gray-400 mr-2 uppercase text-[10px] tracking-wider">{t('dashboard.new_patients.comment')}:</span>
                                <span className="text-gray-700 font-medium">{patient.notes || t('dashboard.new_patients.no_comment')}</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <span className="font-bold text-gray-400 uppercase text-[10px] tracking-wider">{t('dashboard.new_patients.status')}:</span>
                                <span className="bg-emerald-50 text-emerald-600 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                    {t('dashboard.new_patients.status_new')}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => handleAccept(patient.id)}
                                disabled={isUpdating && loadingId === patient.id}
                                className={`flex-1 bg-[#00D775] hover:bg-[#00c56b] text-white py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-black text-xs sm:text-sm shadow-xl shadow-green-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 ${isUpdating && loadingId === patient.id ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {isUpdating && loadingId === patient.id ? (
                                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    t('dashboard.new_patients.accept_btn')
                                )}
                            </button>

                            <button className="w-10 h-10 sm:w-12 sm:h-12 bg-gray-100 hover:bg-gray-200 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all active:scale-95 group">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src="/assets/img/icons/3dots.svg" alt="more" className="w-5 h-5 sm:w-6 sm:h-6 rotate-90 opacity-40 group-hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NewPatients;
