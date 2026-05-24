'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
    TrendingDown,
    TrendingUp,
    ArrowLeft,
    Wallet,
    Wallet2,
    CalendarCheck2,
    ArrowDownRight,
    ArrowUpRight,
    Plus,
    Filter,
    CreditCard
} from 'lucide-react';
import { useRouter } from '@/i18n/navigation';
import AnalyticsFilter from '@/components/Analytics/AnalyticsFilter';
import DoctorPageShell from '@/components/Layout/DoctorPageShell';

interface ServiceItem {
    id: number;
    name: string;
    count: number;
    trend: 'up' | 'down';
}

interface Transaction {
    id: number;
    name: string;
    date: string;
    sum: number;
    isProfit: boolean;
    isSelected?: boolean;
}

const FinancePage: React.FC = () => {
    const t = useTranslations();
    const router = useRouter();
    const [activeView, setActiveView] = useState<'finance' | 'monitoring'>('finance');

    const services: ServiceItem[] = [
        { id: 1, name: t('analytics.finance.services.implantation'), count: 45, trend: 'up' },
        { id: 2, name: t('analytics.finance.services.removal'), count: 40, trend: 'down' },
        { id: 3, name: t('analytics.finance.services.filling'), count: 38, trend: 'up' },
        { id: 4, name: t('analytics.finance.services.prosthetics'), count: 35, trend: 'down' },
        { id: 5, name: t('analytics.finance.services.crown'), count: 30, trend: 'up' }
    ];

    const transactions: Transaction[] = [
        { id: 1, name: 'Эргашев Мамурбек', date: '6 Апр, 2026', sum: 250000, isProfit: true, isSelected: true },
        { id: 2, name: 'Дункан Факовский', date: '6 Апр, 2026', sum: 250000, isProfit: true },
        { id: 3, name: 'Дункан Факовский', date: '6 Апр, 2026', sum: 500000, isProfit: false },
        { id: 4, name: 'Дункан Факовский', date: '6 Апр, 2026', sum: 500000, isProfit: false }
    ];

    const [isFilterOpen, setIsFilterOpen] = useState(false);

    return (
        <DoctorPageShell
            badge={t('finance.shell.badge')}
            title={t('finance.shell.title')}
            accent={t('finance.shell.accent')}
            description={t('finance.shell.description')}
            contentClassName="p-4 sm:p-6 lg:p-8"
        >
            <div className="mx-auto max-w-[1600px]">
                {/* Header Context from Image */}
                <div className="mb-8 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
                    <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                        <button
                            onClick={() => (activeView === 'monitoring' ? setActiveView('finance') : router.back())}
                            className="w-10 h-10 flex items-center justify-center bg-[#1e2235] rounded-full shadow-sm hover:bg-[#2c314a] transition-colors shrink-0"
                        >
                            <ArrowLeft className="w-5 h-5 text-white" />
                        </button>
                        <h2 className="break-words text-2xl font-extrabold tracking-tight text-[#1e2235] sm:text-4xl lg:text-5xl">
                            {activeView === 'finance' ? t('analytics.finance.title') : t('analytics.monitoring.title')}
                        </h2>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <div className="bg-white p-1 rounded-2xl shadow-sm flex items-center gap-1 flex-1 sm:flex-none">
                            {activeView === 'finance' ? (
                                <button
                                    onClick={() => setActiveView('monitoring')}
                                    className="flex-1 sm:flex-none px-4 sm:px-8 lg:px-10 py-2.5 rounded-xl font-bold text-xs sm:text-sm lg:text-base transition-all text-[#1e2235] hover:bg-gray-50"
                                >
                                    {t('analytics.header.monitoring')}
                                </button>
                            ) : (
                                <button
                                    onClick={() => setActiveView('finance')}
                                    className="flex-1 sm:flex-none px-4 sm:px-8 lg:px-10 py-2.5 rounded-xl font-bold text-xs sm:text-sm lg:text-base transition-all bg-[#00d68f] text-white shadow-md active:scale-95"
                                >
                                    {t('analytics.header.finance')}
                                </button>
                            )}
                            <button
                                onClick={() => router.push('/analytics')}
                                className="flex-1 sm:flex-none px-4 sm:px-8 lg:px-10 py-2.5 rounded-xl font-bold text-xs sm:text-sm lg:text-base border border-gray-200 text-[#1e2235] hover:bg-gray-50 transition-all"
                            >
                                {t('analytics.header.analytics')}
                            </button>
                        </div>
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="px-6 lg:px-10 py-3 bg-[#1e2235] text-white rounded-[16px] font-bold flex items-center justify-center gap-2 hover:bg-[#2c314a] transition-all shadow-md text-sm lg:text-base flex-1 sm:flex-none"
                        >
                            <Filter className="w-4 h-4" />
                            {t('analytics.header.filter')}
                        </button>
                    </div>
                </div>

                {activeView === 'finance' ? (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                        {/* Top Row Summary Grid */}
                        <div className="xl:col-span-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6 mb-2">
                            {/* Income Card */}
                            <div className="sm:col-span-1 lg:col-span-3 bg-white rounded-[32px] p-6 shadow-sm flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="text-gray-500 font-bold text-lg leading-tight">{t('analytics.finance.income')}</span>
                                    <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center shrink-0 ml-2">
                                        <Wallet className="w-5 h-5 text-gray-400" />
                                    </div>
                                </div>
                                <div className="mt-2 text-center sm:text-left">
                                    <div className="flex items-baseline justify-center sm:justify-start gap-1">
                                        <span className="text-4xl sm:text-5xl font-black text-[#1e2235]">10,5</span>
                                        <span className="text-xl sm:text-2xl font-bold text-[#1e2235] leading-none">{t('analytics.stats.million')}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs text-gray-400 font-semibold italic">{t('analytics.finance.per_month')}</span>
                                        <div className="flex items-center text-[#ff3b30] font-black">
                                            <span className="text-sm font-bold">-2%</span>
                                            <ArrowDownRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Net Profit Card */}
                            <div className="sm:col-span-1 lg:col-span-3 bg-[#4156d9] rounded-[32px] p-6 shadow-sm text-white flex flex-col justify-between">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="opacity-80 font-bold text-lg leading-tight">{t('analytics.finance.net_profit')}</span>
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 ml-2">
                                        <Wallet2 className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="mt-2 text-center sm:text-left">
                                    <div className="flex items-baseline justify-center sm:justify-start gap-1">
                                        <span className="text-4xl sm:text-5xl font-black">8</span>
                                        <span className="text-xl sm:text-2xl font-bold leading-none">{t('analytics.stats.million')}</span>
                                    </div>
                                    <div className="flex items-center justify-between mt-4">
                                        <span className="text-xs opacity-70 font-semibold italic">{t('analytics.finance.per_month')}</span>
                                        <div className="flex items-center text-[#00d68f] font-black">
                                            <span className="text-sm font-bold">+15%</span>
                                            <ArrowUpRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Statistics Chart */}
                            <div className="col-span-1 sm:col-span-2 lg:col-span-6 bg-white rounded-[32px] p-4 sm:p-6 shadow-sm flex flex-col min-h-[300px] lg:min-h-0">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <h3 className="text-2xl sm:text-3xl font-extrabold text-[#4156d9]">{t('analytics.finance.stats_title')}</h3>
                                    <div className="flex gap-2 w-full sm:w-auto">
                                        <button className="flex-1 sm:flex-none justify-center bg-[#567af3] text-white text-[10px] sm:text-xs px-3 sm:px-5 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm">
                                            <span>{t('analytics.finance.for_year')}</span>
                                            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-white rotate-45 mb-1 opacity-60"></div>
                                        </button>
                                        <button className="flex-1 sm:flex-none justify-center bg-[#567af3] text-white text-[10px] sm:text-xs px-3 sm:px-5 py-2 rounded-full flex items-center gap-2 font-bold shadow-sm">
                                            <span>{t('analytics.finance.total')}</span>
                                            <div className="w-1.5 h-1.5 border-r-2 border-b-2 border-white rotate-45 mb-1 opacity-60"></div>
                                        </button>
                                    </div>
                                </div>
                                <div className="flex-1 relative">
                                    <svg className="w-full h-full overflow-visible" viewBox="0 0 400 100" preserveAspectRatio="none">
                                        {[0, 20, 40, 60, 80, 100].map((v) => (
                                            <line key={v} x1="30" y1={v} x2="400" y2={v} stroke="#f1f3f9" strokeWidth="0.5" />
                                        ))}
                                        <text x="0" y="5" className="text-[6px] fill-gray-400 font-bold">33{t('analytics.stats.million')}</text>
                                        <text x="0" y="50" className="text-[6px] fill-gray-400 font-bold">17{t('analytics.stats.million')}</text>
                                        <text x="0" y="95" className="text-[6px] fill-gray-400 font-bold">1{t('analytics.stats.million')}</text>
                                        <path d="M 30,50 Q 80,20 130,60 T 230,40 T 330,20 T 400,30" fill="none" stroke="#00d68f" strokeWidth="1.5" strokeLinecap="round" />
                                        <path d="M 30,70 Q 80,85 130,70 T 230,85 T 330,70 T 400,80" fill="none" stroke="#fb8a61" strokeWidth="1.5" strokeLinecap="round" />
                                        {[0, 2, 4, 6, 8, 10].map((index) => (
                                            <text key={index} x={30 + index * (370 / 11)} y="115" className="text-[6px] fill-gray-400 font-bold" textAnchor="middle">{t(`common.months_short.${index}`)}</text>
                                        ))}
                                    </svg>
                                </div>
                            </div>
                        </div>

                        {/* Left Column Sections */}
                        <div className="xl:col-span-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-6 bg-[#fb8a61] rounded-[32px] p-6 shadow-sm text-white flex flex-col justify-between h-[200px]">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="opacity-80 font-bold text-lg leading-tight">{t('analytics.finance.expenses')}</span>
                                    <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0 ml-2">
                                        <CreditCard className="w-5 h-5 text-white" />
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black">2</span>
                                        <span className="text-2xl font-bold leading-none">{t('analytics.stats.million')}</span>
                                    </div>
                                    <div className="flex items-center justify-end mt-4">
                                        <div className="flex items-center text-white/90 font-black">
                                            <span className="text-sm font-bold">-2%</span>
                                            <ArrowDownRight className="w-5 h-5" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-6 bg-[#f2c94c] rounded-[32px] p-6 shadow-sm text-[#1e2235] flex flex-col justify-between h-[200px] border border-amber-200/50">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="opacity-80 font-bold text-lg leading-tight">{t('analytics.finance.daily_expenses')}</span>
                                    <div className="w-10 h-10 bg-black/5 rounded-xl flex items-center justify-center shrink-0 ml-2">
                                        <CalendarCheck2 className="w-5 h-5 text-[#1e2235]" />
                                    </div>
                                </div>
                                <div className="mt-auto">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black text-[#1e2235]">250</span>
                                        <span className="text-2xl font-bold text-[#1e2235] leading-none">{t('analytics.stats.thousand')}</span>
                                        <span className="text-sm font-bold opacity-60 ml-2">-2%</span>
                                        <ArrowDownRight className="w-5 h-5 opacity-60" />
                                    </div>
                                    <div className="mt-4 text-sm font-bold opacity-70 italic text-[#1e2235]/60">{t('analytics.finance.avg_per_day')}</div>
                                </div>
                            </div>

                            <div className="lg:col-span-12 bg-white rounded-[40px] p-8 shadow-sm">
                                <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                                    <h3 className="text-[#4156d9] font-black text-3xl">{t('analytics.finance.today')}</h3>
                                    <button className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-[#fb8a61] px-6 py-2.5 font-bold text-[#fb8a61] sm:w-auto sm:px-8">
                                        <Plus className="w-5 h-5" />
                                        <span className="text-lg">+{t('analytics.finance.add_expense')}</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-6">
                                    <div className="lg:col-span-5 bg-[#00d68f] rounded-[32px] p-8 text-white flex flex-col justify-between min-h-[160px]">
                                        <span className="block opacity-80 text-lg font-bold">{t('analytics.finance.profit')}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl lg:text-6xl font-black">700</span>
                                            <span className="text-3xl font-bold">{t('analytics.stats.thousand')}</span>
                                        </div>
                                    </div>
                                    <div className="lg:col-span-7 bg-[#fb8a61] rounded-[32px] p-8 text-white flex flex-col justify-between min-h-[160px]">
                                        <span className="block opacity-80 text-lg font-bold">{t('analytics.finance.today_expenses')}</span>
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl lg:text-6xl font-black">100</span>
                                            <span className="text-3xl font-bold">{t('analytics.stats.thousand')}</span>
                                        </div>
                                    </div>
                                    <div className="group flex flex-col gap-6 rounded-[32px] bg-[#5377f7] p-8 text-white transition-all hover:bg-[#4156d9] lg:col-span-12 sm:flex-row sm:items-center sm:justify-between">
                                        <div className="flex flex-col">
                                            <span className="opacity-80 text-lg font-bold mb-1">{t('analytics.finance.appointments')}</span>
                                            <span className="text-6xl font-black">8</span>
                                        </div>
                                        <button className="rounded-3xl bg-white px-8 py-4 text-lg font-black text-[#567af3] sm:px-10 sm:py-5 sm:text-xl">
                                            {t('analytics.finance.view')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="xl:col-span-4 h-full">
                            <div className="bg-white rounded-[40px] p-8 lg:p-10 shadow-sm h-full flex flex-col">
                                <h3 className="text-[#4156d9] font-extrabold text-3xl mb-2">{t('analytics.finance.top_services')}</h3>
                                <div className="text-gray-400 font-bold text-xl mb-8">{t('analytics.finance.per_month')}</div>
                                <div className="space-y-4 flex-1">
                                    {services.map((service, index) => (
                                        <div key={service.id} className="flex flex-col gap-4 rounded-[24px] border border-amber-200/50 bg-[#fdbc31] p-5 text-[#1e2235] shadow-sm sm:flex-row sm:items-center sm:justify-between lg:p-7">
                                            <div className="flex min-w-0 items-center gap-4">
                                                <span className="text-gray-800 font-extrabold text-xl opacity-40">{index + 1}</span>
                                                <span className="min-w-0 break-words font-bold text-xl leading-tight">{service.name}</span>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-4 self-end sm:self-auto">
                                                <span className="font-black text-3xl">{service.count}</span>
                                                {service.trend === 'up' ? <TrendingUp className="w-8 h-8 text-green-800" /> : <TrendingDown className="w-8 h-8 text-red-800" />}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Monitoring View (matches design image) */
                    <div className="bg-white rounded-[40px] p-1 shadow-sm overflow-hidden">
                        {/* Desktop Header (Hidden on Mobile) */}
                        <div className="hidden sm:grid grid-cols-12 bg-gray-100/50 p-6 font-bold text-gray-400 text-xl border-b border-gray-100">
                            <div className="col-span-5">{t('analytics.monitoring.name')}</div>
                            <div className="col-span-4 text-center">{t('analytics.monitoring.date')}</div>
                            <div className="col-span-3 text-right pr-6">{t('analytics.monitoring.sum')}</div>
                        </div>

                        {/* List Items (Table on Desktop, Cards on Mobile) */}
                        <div className="p-4 space-y-4 min-h-[500px]">
                            {transactions.map((tx) => (
                                <div
                                    key={tx.id}
                                    className={`flex flex-col sm:grid sm:grid-cols-12 items-center p-6 sm:p-8 rounded-[32px] transition-all cursor-pointer hover:shadow-md gap-4 sm:gap-0 ${
                                        tx.isSelected
                                            ? 'bg-[#b6c2ff] text-white shadow-lg scale-[1.01]'
                                            : 'bg-white text-[#1e2235]'
                                    }`}
                                >
                                    <div className="w-full sm:col-span-5 font-bold text-xl sm:text-2xl text-center sm:text-left truncate">
                                        {tx.name}
                                    </div>
                                    <div className={`w-full sm:col-span-4 text-center text-lg sm:text-xl font-bold ${tx.isSelected ? 'text-white/80' : 'text-gray-400'}`}>
                                        {tx.date}
                                    </div>
                                    <div className={`w-full sm:col-span-3 text-center sm:text-right font-black text-xl sm:text-2xl sm:pr-2 ${
                                        tx.isSelected
                                            ? 'text-white'
                                            : tx.isProfit ? 'text-[#00d68f]' : 'text-red-500'
                                    }`}>
                                        <span className="sm:hidden text-gray-400 font-bold text-sm mr-2">{t('analytics.monitoring.sum')}:</span>
                                        {tx.isProfit ? '+' : '-'}{tx.sum.toLocaleString()}сум
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <AnalyticsFilter
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
            />
        </DoctorPageShell>
    );
};

export default FinancePage;
