'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calculator } from 'lucide-react';
import { useTranslations } from 'next-intl';

import AppointmentModal from './AppointmentModal';
import { useMyAppointments } from '@/api/appointments';

interface CalendarViewProps {
    onBack: () => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onBack }) => {
    const t = useTranslations();
    const [viewDate, setViewDate] = useState(new Date());
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { data: apiAppointments } = useMyAppointments();

    const weekDays = React.useMemo(() => {
        return [1, 2, 3, 4, 5, 6, 0].map(d => t(`common.weekdays.${d}`));
    }, [t]);

    const days = React.useMemo(() => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);

        let firstDayIndex = firstDayOfMonth.getDay() - 1;
        if (firstDayIndex === -1) firstDayIndex = 6;

        const appointmentCounts: Record<string, number> = {};
        if (apiAppointments && Array.isArray(apiAppointments)) {
            apiAppointments.forEach(apt => {
                const raw = apt.start_time;
                const utc = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
                const aptDate = new Date(utc);
                const dateKey = `${aptDate.getFullYear()}-${aptDate.getMonth()}-${aptDate.getDate()}`;
                appointmentCounts[dateKey] = (appointmentCounts[dateKey] || 0) + 1;
            });
        }

        const generatedDays: Array<{
            date: number;
            isPrevMonth?: boolean;
            isNextMonth?: boolean;
            isCurrentMonth?: boolean;
            isWeekend?: boolean;
            appointments: number;
        }> = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();
        for (let i = firstDayIndex - 1; i >= 0; i--) {
            generatedDays.push({
                date: prevMonthLastDay - i,
                isPrevMonth: true,
                appointments: 0
            });
        }

        for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
            const currentDayDate = new Date(year, month, i);
            const dayOfWeek = currentDayDate.getDay();
            const dateKey = `${year}-${month}-${i}`;
            const aptCount = appointmentCounts[dateKey] || 0;
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            generatedDays.push({
                date: i,
                appointments: aptCount,
                isWeekend: isWeekend,
                isCurrentMonth: true
            });
        }

        const totalSlots = 42;
        const remainingSlots = totalSlots - generatedDays.length;

        for (let i = 1; i <= remainingSlots; i++) {
            const currentDayDate = new Date(year, month + 1, i);
            const dayOfWeek = currentDayDate.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

            generatedDays.push({
                date: i,
                isNextMonth: true,
                isWeekend: isWeekend,
                appointments: 0
            });
        }

        return generatedDays;
    }, [viewDate, apiAppointments]);

    const handleNextMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
    };

    const handlePrevMonth = () => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    };

    const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1));
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1));
    };

    const months = Array.from({ length: 12 }, (_, i) => ({
        value: i,
        label: t(`common.months.${i}`)
    }));

    const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-5 duration-500 pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={onBack}
                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <div className="bg-[#1a1f36] rounded-full p-1">
                            <ChevronLeft className="w-5 h-5 text-white" />
                        </div>
                    </button>
                    <h1 className="text-3xl font-black text-[#1a1f36] tracking-tight">{t('appointments.title')}</h1>
                </div>

                <div className="flex items-center">
                    <div className="flex items-center bg-[#1a1f36] rounded-[16px] p-1.5 pl-5 pr-1.5 gap-3">
                        <span className="text-white font-bold text-sm">{t('appointments.month_view.month_appointments')}</span>
                        <div className="bg-white rounded-[12px] px-3 py-2 min-w-[40px] flex items-center justify-center">
                            <span className="text-[#1a1f36] font-black text-lg">
                                {apiAppointments?.filter(apt => {
                                    const raw = apt.start_time;
                                    const utc = raw.endsWith('Z') || raw.includes('+') ? raw : raw + 'Z';
                                    const aptDate = new Date(utc);
                                    return aptDate.getMonth() === viewDate.getMonth() &&
                                           aptDate.getFullYear() === viewDate.getFullYear();
                                }).length || 0}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrevMonth}
                        className="bg-[#d1d5db] w-12 h-12 flex items-center justify-center rounded-[16px] hover:bg-gray-400 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-[#1a1f36]" />
                    </button>

                    <div className="flex gap-2">
                        <div className="relative group">
                            <select
                                value={viewDate.getMonth()}
                                onChange={handleMonthChange}
                                className="appearance-none bg-white px-6 py-3 pr-12 rounded-[16px] shadow-sm text-xl font-black text-[#1a1f36] cursor-pointer outline-none hover:bg-gray-50 transition-colors"
                            >
                                {months.map(m => (
                                    <option key={m.value} value={m.value}>{m.label}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1f36] pointer-events-none rotate-90" />
                        </div>

                        <div className="relative group">
                            <select
                                value={viewDate.getFullYear()}
                                onChange={handleYearChange}
                                className="appearance-none bg-white px-6 py-3 pr-12 rounded-[16px] shadow-sm text-xl font-black text-[#1a1f36] cursor-pointer outline-none hover:bg-gray-50 transition-colors"
                            >
                                {years.map(y => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#1a1f36] pointer-events-none rotate-90" />
                        </div>
                    </div>

                    <button
                        onClick={handleNextMonth}
                        className="bg-[#d1d5db] w-12 h-12 flex items-center justify-center rounded-[16px] hover:bg-gray-400 transition-colors"
                    >
                        <ChevronRight className="w-6 h-6 text-[#1a1f36]" />
                    </button>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-2 bg-white px-6 py-3 rounded-[16px] shadow-sm text-[#1a1f36] font-black hover:bg-gray-50 transition-colors">
                        <Calculator className="w-5 h-5" />
                        <span>{t('appointments.title')}</span>
                    </button>
                    <button onClick={() => setIsModalOpen(true)} className="px-6 md:px-10 py-3 bg-[#00e396] text-white font-bold rounded-[16px] shadow-lg shadow-[#00e396]/20 hover:bg-[#00d08a] transition-all active:scale-95 text-sm md:text-base cursor-pointer">
                        {t('appointments.record_appointment')}
                    </button>
                </div>
            </div>

            <div className="mt-6">
                <div className="grid grid-cols-7 gap-1 md:gap-4 mb-2 md:mb-4">
                    {weekDays.map(day => (
                        <div key={day} className="text-xs md:text-xl font-black text-[#1a1f36] text-center capitalize">
                            {day}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-1 md:gap-3 sm:gap-4">
                    {days.map((day, idx) => (
                        <div
                            key={idx}
                            className={`
                                relative aspect-square md:aspect-[1/0.85] rounded-[12px] md:rounded-[24px] overflow-hidden p-1 md:p-2 flex flex-col items-center justify-end
                                ${day.isWeekend
                                    ? 'bg-[#10d16d]'
                                    : (day.isPrevMonth || day.isNextMonth ? 'bg-[#f0f0f0]' : 'bg-[#eef2f6]')
                                }
                            `}
                        >
                            <div className={`absolute top-1 right-1.5 md:top-3 md:right-4 text-sm md:text-2xl font-bold ${day.isWeekend ? 'text-white' : 'text-[#bdbdbd]'}`}>
                                {day.date}
                            </div>

                            <div className="w-full mb-1 md:mb-2">
                                {day.isWeekend ? (
                                    <div className="text-center text-white font-medium text-[8px] md:text-sm leading-tight">
                                        <span className="hidden md:inline">{t('appointments.month_view.weekend')}</span>
                                        <span className="md:hidden">Вых.</span>
                                    </div>
                                ) : (
                                    (day.isCurrentMonth || day.isNextMonth) && !day.isWeekend && day.appointments > 0 ? (
                                        <div className="bg-[#4f6bff] mx-auto w-full md:w-[90%] py-0.5 md:py-1 rounded-full flex items-center justify-center md:justify-between px-1 md:px-1.5 overflow-hidden">
                                            <span className="text-white text-[11px] font-bold pl-2 truncate hidden md:block">{t('dashboard.appointments_card.title')}</span>
                                            <div className="bg-white w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center shrink-0">
                                                <span className="text-[#4f6bff] text-[9px] md:text-[10px] font-black">{day.appointments}</span>
                                            </div>
                                        </div>
                                    ) : null
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <AppointmentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default CalendarView;
