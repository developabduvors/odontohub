'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Users, CalendarCheck, CalendarClock, TrendingUp, CheckCircle, Clock, CalendarDays } from 'lucide-react';

import { useDentistStats } from '@/api/profile';
import { useMyAppointments } from '@/api/appointments';
import AnalyticsHeader from '@/components/Analytics/AnalyticsHeader';
import DoctorPageShell from '@/components/Layout/DoctorPageShell';

type Period = 'week' | 'month';

const AnalyticsPage = () => {
    const t = useTranslations();
    const { data: stats, isLoading } = useDentistStats();
    const { data: allAppointments = [] } = useMyAppointments();
    const [period, setPeriod] = useState<Period>('month');

    const filtered = useMemo(() => {
        const now = new Date();
        const cutoff = period === 'week'
            ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            : new Date(now.getFullYear(), now.getMonth(), 1);
        return allAppointments.filter(a => new Date(a.start_time) >= cutoff);
    }, [allAppointments, period]);

    const completed = filtered.filter(a => a.status === 'completed').length;
    const cancelled = filtered.filter(a => a.status === 'cancelled').length;
    const moved = filtered.filter(a => a.status === 'moved').length;
    const pending = filtered.filter(a => a.status === 'pending' || a.status === 'confirmed').length;
    const total = filtered.length;

    const monthlyCounts = Array(12).fill(0);
    allAppointments.forEach(a => {
        const m = new Date(a.start_time).getMonth();
        monthlyCounts[m]++;
    });
    const maxMonthly = Math.max(...monthlyCounts, 1);

    const statCards = [
        { label: 'Jami qabullar', value: isLoading ? '...' : stats?.total_appointments ?? 0, icon: CalendarCheck, color: 'bg-[#5377f7]', text: 'text-white' },
        { label: 'Bugungi qabullar', value: isLoading ? '...' : stats?.appointments_today ?? 0, icon: CalendarDays, color: 'bg-[#00d68f]', text: 'text-white' },
        { label: 'Bu oyda', value: isLoading ? '...' : stats?.appointments_this_month ?? 0, icon: CalendarClock, color: 'bg-[#f2c94c]', text: 'text-[#1e2235]' },
        { label: 'Kutilayotgan', value: isLoading ? '...' : stats?.pending_appointments ?? 0, icon: Clock, color: 'bg-white border border-gray-100', text: 'text-[#1e2235]' },
        { label: 'Tugallangan', value: isLoading ? '...' : stats?.completed_appointments ?? 0, icon: CheckCircle, color: 'bg-white border border-gray-100', text: 'text-[#1e2235]' },
        { label: 'Jami bemorlar', value: isLoading ? '...' : stats?.total_patients ?? 0, icon: Users, color: 'bg-[#1e2235]', text: 'text-white' },
    ];

    const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
    const pct = (n: number) => total > 0 ? Math.round((n / total) * 100) : 0;

    return (
        <DoctorPageShell
            badge={t('analytics.shell.badge')}
            title={t('analytics.shell.title')}
            accent={t('analytics.shell.accent')}
            description={t('analytics.shell.description')}
            contentClassName="p-4 sm:p-6 lg:p-8"
        >
            <div className="mx-auto max-w-[1600px]">
                <AnalyticsHeader />

                <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:mb-8 md:gap-4 xl:grid-cols-6">
                    {statCards.map((card, i) => {
                        const Icon = card.icon;
                        return (
                            <div key={i} className={`${card.color} flex flex-col gap-2 rounded-[20px] p-4 shadow-sm md:gap-3 md:rounded-[28px] md:p-6`}>
                                <div className={`flex h-8 w-8 items-center justify-center rounded-xl md:h-10 md:w-10 md:rounded-2xl ${card.text === 'text-white' ? 'bg-white/20' : 'bg-gray-100'}`}>
                                    <Icon size={18} className={card.text} />
                                </div>
                                <div className={`text-2xl font-black md:text-3xl xl:text-4xl ${card.text}`}>{String(card.value)}</div>
                                <div className={`text-[11px] font-bold md:text-xs ${card.text === 'text-white' ? 'opacity-70' : 'text-gray-400'}`}>{card.label}</div>
                            </div>
                        );
                    })}
                </div>

                <div className="mb-6 flex flex-wrap gap-3">
                    <button
                        onClick={() => setPeriod('week')}
                        className={`rounded-2xl px-6 py-2.5 text-sm font-bold transition-all ${period === 'week' ? 'bg-[#5377f7] text-white shadow-lg shadow-blue-500/20' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        1 hafta
                    </button>
                    <button
                        onClick={() => setPeriod('month')}
                        className={`rounded-2xl px-6 py-2.5 text-sm font-bold transition-all ${period === 'month' ? 'bg-[#5377f7] text-white shadow-lg shadow-blue-500/20' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
                    >
                        1 oy
                    </button>
                </div>

                <div className="mb-4 grid grid-cols-1 gap-4 md:mb-6 md:gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-[24px] bg-white p-4 shadow-sm md:rounded-[32px] md:p-8">
                        <div className="mb-4 flex items-center justify-between md:mb-8">
                            <h3 className="text-lg font-black text-[#1e2235] md:text-2xl">Oylik qabullar</h3>
                            <span className="text-sm font-bold text-gray-400">{new Date().getFullYear()}</span>
                        </div>
                        <div className="flex h-36 items-end gap-1 md:h-48 md:gap-2">
                            {monthlyCounts.map((count, i) => (
                                <div key={i} className="group flex h-full flex-1 flex-col items-center justify-end gap-2">
                                    <div
                                        className="relative w-full cursor-pointer rounded-lg bg-[#5377f7] transition-all hover:bg-[#4156d9]"
                                        style={{ height: `${Math.max((count / maxMonthly) * 100, count > 0 ? 8 : 2)}%` }}
                                    >
                                        {count > 0 && (
                                            <div className="absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded bg-[#1e2235] px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                                                {count} ta
                                            </div>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-bold text-gray-400">{months[i]}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex flex-col rounded-[24px] bg-white p-4 shadow-sm md:rounded-[32px] md:p-8">
                        <h3 className="mb-2 text-lg font-black text-[#1e2235] md:text-2xl">Holat bo&apos;yicha</h3>
                        <p className="mb-4 text-xs font-bold text-gray-400 md:mb-6">{period === 'week' ? 'So\'nggi 7 kun' : 'Bu oy'} - {total} ta qabul</p>
                        <div className="flex flex-1 flex-col justify-center space-y-4">
                            {[
                                { label: 'Tugallangan', value: completed, pct: pct(completed), color: '#1cdb6f' },
                                { label: 'Kutilayotgan', value: pending, pct: pct(pending), color: '#5377f7' },
                                { label: 'Ko\'chirilgan', value: moved, pct: pct(moved), color: '#f2c94c' },
                                { label: 'Bekor qilingan', value: cancelled, pct: pct(cancelled), color: '#ef4444' },
                            ].map((item) => (
                                <div key={item.label} className="space-y-1.5">
                                    <div className="flex justify-between text-sm font-bold">
                                        <span className="text-gray-500">{item.label}</span>
                                        <span style={{ color: item.color }}>{item.value} ({item.pct}%)</span>
                                    </div>
                                    <div className="h-3 overflow-hidden rounded-full bg-gray-100">
                                        <div className="h-full rounded-full transition-all" style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 md:mt-6 md:pt-6">
                            {[
                                { label: 'Tugallangan', value: completed, color: 'text-[#1cdb6f]' },
                                { label: 'Kutilmoqda', value: pending, color: 'text-[#5377f7]' },
                                { label: "Ko'chirilgan", value: moved, color: 'text-[#f2c94c]' },
                                { label: 'Bekor', value: cancelled, color: 'text-red-400' },
                            ].map(item => (
                                <div key={item.label} className="text-center">
                                    <div className={`text-xl font-black md:text-2xl ${item.color}`}>{item.value}</div>
                                    <div className="text-xs font-bold text-gray-400">{item.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 xl:grid-cols-3">
                    <div className="flex flex-col justify-between rounded-[24px] bg-[#4156d9] p-5 text-white shadow-sm md:rounded-[32px] md:p-8">
                        <div className="mb-3 flex items-center justify-between md:mb-4">
                            <span className="text-sm font-bold opacity-80 md:text-lg">Bu hafta yangi bemorlar</span>
                            <TrendingUp size={20} className="shrink-0 opacity-60" />
                        </div>
                        <div className="text-5xl font-black md:text-7xl">{isLoading ? '...' : stats?.new_patients_this_week ?? 0}</div>
                        <div className="mt-2 text-xs opacity-60 md:text-sm">so&apos;nggi 7 kun ichida</div>
                    </div>

                    <div className="flex flex-col justify-between rounded-[24px] bg-white p-5 shadow-sm md:rounded-[32px] md:p-8">
                        <h3 className="mb-3 text-lg font-black text-[#1e2235] md:mb-4 md:text-xl">Bugun</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between rounded-2xl bg-[#f5f7fb] p-3 md:p-4">
                                <span className="text-sm font-bold text-gray-500">Qabullar</span>
                                <span className="text-xl font-black text-[#1e2235] md:text-2xl">{isLoading ? '...' : stats?.appointments_today ?? 0}</span>
                            </div>
                            <div className="flex items-center justify-between rounded-2xl bg-[#f5f7fb] p-3 md:p-4">
                                <span className="text-sm font-bold text-gray-500">Bu oy</span>
                                <span className="text-xl font-black text-[#1e2235] md:text-2xl">{isLoading ? '...' : stats?.appointments_this_month ?? 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col justify-between rounded-[24px] bg-[#1e2235] p-5 text-white shadow-sm md:rounded-[32px] md:p-8">
                        <div className="mb-3 flex items-center justify-between md:mb-4">
                            <span className="text-sm font-bold opacity-80 md:text-lg">Umumiy ko&apos;rsatkichlar</span>
                            <Users size={20} className="shrink-0 opacity-60" />
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm opacity-60">Jami bemorlar</span>
                                <span className="text-lg font-black md:text-xl">{isLoading ? '...' : stats?.total_patients ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm opacity-60">Jami qabullar</span>
                                <span className="text-lg font-black md:text-xl">{isLoading ? '...' : stats?.total_appointments ?? 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm opacity-60">Tugallangan</span>
                                <span className="text-lg font-black text-[#1cdb6f] md:text-xl">{isLoading ? '...' : stats?.completed_appointments ?? 0}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DoctorPageShell>
    );
};

export default AnalyticsPage;
