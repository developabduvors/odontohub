'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, Calculator } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { useRouter } from '@/i18n/navigation';
import DateStrip from '@/components/Appointments/DateStrip';
import AppointmentCard, { type AppointmentStatus } from '@/components/Appointments/AppointmentCard';
import CalendarView from '@/components/Appointments/CalendarView';
import AppointmentModal from '@/components/Appointments/AppointmentModal';
import { toast } from '@/components/Shared/Toast';
import { useMyAppointments } from '@/api/appointments';
import { useServices } from '@/api/services';

const AppointmentsPage: React.FC = () => {
    const t = useTranslations();
    const router = useRouter();
    const [view, setView] = useState<'list' | 'calendar'>('list');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const { data: apiAppointments, isLoading } = useMyAppointments();
    const { data: services } = useServices();

    const allAppointmentsData = useMemo(() => {
        if (!apiAppointments || !Array.isArray(apiAppointments)) return [];

        const userData = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user_data') || '{}') : {};
        const accessToken = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
        const isLocalMode = accessToken?.startsWith('local_token_');

        return apiAppointments
            .filter(app => {
                if (isLocalMode && userData.role === 'dentist') {
                    const dentistId = userData.dentist_id || 2;
                    if (app.dentist_id !== dentistId) return false;
                }
                return true;
            })
            .map(app => {
                const rawTime = app.start_time;
                const utcTime = rawTime.endsWith('Z') || rawTime.includes('+') ? rawTime : rawTime + 'Z';
                const startDate = new Date(utcTime);
                const time = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;

                let status: AppointmentStatus = 'in_queue';
                if (app.status === 'completed') status = 'completed';
                else if (app.status === 'cancelled') status = 'cancelled';
                else if (app.status === 'moved') status = 'rescheduled';
                else if (app.status === 'confirmed') status = 'in_progress';
                else if (app.status === 'pending') status = 'pending';

                const serviceLabel = app.service === 'implantation' ? t('modal.services.implantation') :
                    app.service === 'hygiene' ? 'Гигиена' :
                        app.service === 'treatment' ? 'Лечение' :
                            app.service === 'extraction' ? 'Удаление' :
                                app.service || t('modal.services.implantation');

                const date = `${startDate.getDate().toString().padStart(2, '0')}.${(startDate.getMonth() + 1).toString().padStart(2, '0')}.${startDate.getFullYear()}`;
                const dateStr = `${startDate.getFullYear()}-${(startDate.getMonth() + 1).toString().padStart(2, '0')}-${startDate.getDate().toString().padStart(2, '0')}`;

                const matchingService = services?.find(s => s.name === app.service);
                const price = matchingService?.price ?? app.price;

                return {
                    id: app.id,
                    time,
                    date,
                    dateStr,
                    dateObj: startDate,
                    status,
                    service: serviceLabel,
                    patientName: app.patient_name || 'Пациент',
                    notes: app.notes || null,
                    raw: { ...app, price }
                };
            })
            .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
    }, [apiAppointments, t, services]);

    const effectiveDate = useMemo(() => {
        if (selectedDate) return selectedDate;
        if (allAppointmentsData.length === 0) return new Date();
        const today = new Date(); today.setHours(0, 0, 0, 0);
        const upcoming = allAppointmentsData.find(a => {
            const d = new Date(a.dateObj); d.setHours(0, 0, 0, 0);
            return d >= today;
        });
        return upcoming ? upcoming.dateObj : new Date();
    }, [selectedDate, allAppointmentsData]);

    const appointmentsData = useMemo(() => {
        const selectedDateStr = `${effectiveDate.getFullYear()}-${(effectiveDate.getMonth() + 1).toString().padStart(2, '0')}-${effectiveDate.getDate().toString().padStart(2, '0')}`;
        return allAppointmentsData.filter(a => a.dateStr === selectedDateStr);
    }, [allAppointmentsData, effectiveDate]);

    const handleAptClick = () => {
        // AppointmentDetailModal + InProgressView stub — Phase 2c'da port qilinadi
        toast.info(t('patient.alerts.function_in_development'));
    };

    const day = effectiveDate.getDate();
    const month = t(`common.months.${effectiveDate.getMonth()}`);
    const year = effectiveDate.getFullYear();
    const formattedDate = `${day} ${month}, ${year}`;

    return (
        <div className="p-4 md:p-10 bg-[#f8fbff] min-h-screen relative">
            <div className="max-w-[1600px] mx-auto space-y-6 md:space-y-10">
                {view === 'calendar' ? (
                    <CalendarView onBack={() => setView('list')} />
                ) : (
                    <>
                        <div className="flex flex-col gap-6">
                            <div className="relative flex min-h-12 items-center sm:h-14">
                                <div className="flex min-w-0 items-center gap-3 sm:absolute sm:left-0 sm:top-1/2 sm:-translate-y-1/2 sm:gap-4">
                                    <button
                                        onClick={() => router.back()}
                                        className="shrink-0 rounded-full bg-[#1a1f36] p-1 cursor-pointer transition-colors hover:bg-[#2a2f46]"
                                    >
                                        <ChevronLeft className="w-5 h-5 text-white" />
                                    </button>
                                    <h1 className="truncate text-2xl font-black tracking-tight text-[#1a1f36] sm:text-3xl">{t('appointments.title')}</h1>
                                </div>
                            </div>

                            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
                                <h2 className="text-2xl font-black tracking-tight text-[#1a1f36] sm:text-3xl md:text-4xl xl:text-5xl">{formattedDate}</h2>
                                <div className="flex flex-wrap items-center gap-3 md:gap-4 self-start xl:self-auto">
                                    <button
                                        onClick={() => setView('calendar')}
                                        className="flex items-center gap-2 px-5 md:px-8 py-3 bg-white text-[#1a1f36] font-bold rounded-[16px] shadow-sm hover:shadow-md transition-all active:scale-95 text-xs md:text-base cursor-pointer shrink-0"
                                    >
                                        <Calculator className="w-5 h-5 flex-shrink-0" />
                                        <span>{t('appointments.calendar')}</span>
                                    </button>
                                    <button
                                        onClick={() => setIsModalOpen(true)}
                                        className="px-5 md:px-10 py-3 bg-[#00e396] text-white font-bold rounded-[16px] shadow-lg shadow-[#00e396]/20 hover:bg-[#00d08a] transition-all active:scale-95 text-xs md:text-base cursor-pointer shrink-0"
                                    >
                                        {t('appointments.record_appointment')}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <DateStrip selectedDate={effectiveDate} onDateChange={setSelectedDate} />

                        {isLoading ? (
                            <div className="flex justify-center py-20">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1a1f36]" />
                            </div>
                        ) : appointmentsData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                {appointmentsData.map((apt, idx) => (
                                    <AppointmentCard
                                        key={apt.id || idx}
                                        time={apt.time}
                                        service={apt.service}
                                        patientName={apt.patientName}
                                        status={apt.status}
                                        notes={apt.notes}
                                        onClick={handleAptClick}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-40">
                                <p className="text-gray-400 font-bold text-xl mb-2">Нет записей</p>
                                <p className="text-gray-300 text-sm">На выбранную дату записей нет</p>
                            </div>
                        )}
                    </>
                )}
            </div>

            <AppointmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => toast.success(t('appointments.success_toast'))}
            />
        </div>
    );
};

export default AppointmentsPage;
