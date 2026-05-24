'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnalyticsFilterProps {
    isOpen: boolean;
    onClose: () => void;
}

const AnalyticsFilter: React.FC<AnalyticsFilterProps> = ({ isOpen, onClose }) => {
    const t = useTranslations();
    const [period, setPeriod] = useState(t('analytics.filter.period_year'));
    const [status, setStatus] = useState('Все');
    const [patientType, setPatientType] = useState('Все');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/5 backdrop-blur-[2px] transition-opacity"
                onClick={onClose}
            ></div>

            {/* Sidebar content */}
            <div className="relative w-full max-w-[440px] bg-white h-screen shadow-2xl flex flex-col p-6 transition-all duration-300">
                {/* Header */}
                <div className="flex items-center justify-center mb-10">
                    <h2 className="text-[28px] font-bold text-[#1e2235]">{t('analytics.filter.title')}</h2>
                </div>

                <div className="space-y-10 flex-1 overflow-y-auto custom-scrollbar">
                    {/* Period Section */}
                    <div className="flex items-center justify-between">
                        <h3 className="text-[22px] font-bold text-[#1e2235]">{t('analytics.filter.period')}</h3>
                        <button className="flex items-center gap-3 bg-[#f5f5f5] px-5 py-2.5 rounded-[16px] text-[15px] font-medium text-[#1e2235] hover:bg-gray-200 transition-colors">
                            {period}
                            <ChevronDown className="w-5 h-5 stroke-[2.5]" />
                        </button>
                    </div>

                    {/* Status Section */}
                    <div className="space-y-5">
                        <h3 className="text-[22px] font-bold text-[#1e2235]">{t('analytics.filter.statuses')}</h3>
                        <div className="flex gap-3">
                            {[
                                { id: 'Все', label: t('analytics.filter.all'), bg: 'bg-[#e8ecff]', text: 'text-[#4d6efd]', border: 'border-[#4d6efd]' },
                                { id: 'Завершённые', label: t('analytics.filter.completed'), bg: 'bg-[#e8f7ee]', text: 'text-[#1cdb6f]', border: 'border-[#1cdb6f]' },
                                { id: 'Отменённые', label: t('analytics.filter.cancelled'), bg: 'bg-[#ffe8e8]', text: 'text-[#f21d1d]', border: 'border-[#f21d1d]' }
                            ].map((s) => (
                                <button
                                    key={s.id}
                                    onClick={() => setStatus(s.id)}
                                    className={`px-5 py-2.5 rounded-[18px] text-[14px] font-semibold transition-all flex-1 ${status === s.id
                                            ? `${s.bg} ${s.text} border-2 ${s.border}`
                                            : `${s.bg} ${s.text} border-2 border-transparent`
                                        }`}
                                >
                                    {s.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Patient Section */}
                    <div className="space-y-5">
                        <h3 className="text-[22px] font-bold text-[#1e2235]">{t('analytics.filter.patient')}</h3>
                        <div className="flex gap-3">
                            {[
                                { id: 'Все', label: t('analytics.filter.all'), bg: 'bg-[#e8ecff]', text: 'text-[#4d6efd]', border: 'border-[#4d6efd]' },
                                { id: 'Новые', label: t('analytics.filter.new'), bg: 'bg-[#e8f7ee]', text: 'text-[#1cdb6f]', border: 'border-[#1cdb6f]' },
                                { id: 'Повторные', label: t('analytics.filter.recurring'), bg: 'bg-[#fff9e8]', text: 'text-[#fbc947]', border: 'border-[#fbc947]' }
                            ].map((p) => (
                                <button
                                    key={p.id}
                                    onClick={() => setPatientType(p.id)}
                                    className={`px-5 py-2.5 rounded-[18px] text-[14px] font-semibold transition-all flex-1 ${patientType === p.id
                                            ? `${p.bg} ${p.text} border-2 ${p.border}`
                                            : `${p.bg} ${p.text} border-2 border-transparent`
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="flex gap-3 mt-auto pt-6">
                    <button
                        className="flex-1 bg-[#4d6efd] text-white py-4 rounded-[18px] font-semibold text-[16px] hover:bg-blue-600 transition-all active:scale-[0.98]"
                        onClick={onClose}
                    >
                        {t('analytics.filter.apply')}
                    </button>
                    <button
                        className="flex-1 bg-[#f5f5f5] text-[#1e2235] py-4 rounded-[18px] font-semibold text-[16px] hover:bg-gray-200 transition-colors active:scale-[0.98]"
                        onClick={() => {
                            setPeriod(t('analytics.filter.period_year'));
                            setStatus('Все');
                            setPatientType('Все');
                        }}
                    >
                        {t('analytics.filter.reset')}
                    </button>
                </div>
            </div>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e5e7eb;
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default AnalyticsFilter;
