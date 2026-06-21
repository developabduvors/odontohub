'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslations, useLocale } from 'next-intl';

interface DayItem {
    day: string;
    date: number;
    fullDate: Date;
}

interface DateStripProps {
    selectedDate: Date;
    onDateChange: (date: Date) => void;
}

const DateStrip: React.FC<DateStripProps> = ({ selectedDate, onDateChange }) => {
    const t = useTranslations();
    const locale = useLocale();
    const [days, setDays] = useState<DayItem[]>([]);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const generatedDays: DayItem[] = [];
        const start = new Date();
        start.setDate(start.getDate() - 3);

        for (let i = 0; i < 14; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);

            generatedDays.push({
                day: t(`common.weekdays.${current.getDay()}`),
                date: current.getDate(),
                fullDate: current
            });
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- locale/tarjima o'zgarganda kunlar ro'yxatini qayta hosil qilish
        setDays(generatedDays);
    }, [locale, t]);

    const isSameDay = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear();
    };

    const handleDateClick = (date: Date) => {
        onDateChange(date);
    };

    return (
        <div
            ref={scrollRef}
            className="flex items-center bg-white rounded-[24px] p-4 shadow-sm overflow-x-auto gap-2 md:gap-4 no-scrollbar scroll-smooth w-full"
        >
            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
            {days.map((item, index) => {
                const active = isSameDay(item.fullDate, selectedDate);
                return (
                    <div
                        key={index}
                        onClick={() => handleDateClick(item.fullDate)}
                        className={`
                             flex flex-col items-center justify-center min-w-[70px] md:min-w-[80px] h-[90px] md:h-[100px] rounded-[20px] md:rounded-[24px] cursor-pointer transition-all duration-300 shrink-0
                             ${active
                                ? 'bg-[#4f6bff] text-white shadow-lg shadow-[#4f6bff]/30 scale-105'
                                : 'text-[#4f6bff] hover:bg-blue-50'
                            }
                        `}
                    >
                        <span className={`text-base md:text-lg font-bold mb-1 capitalize ${active ? 'text-white' : 'text-[#4f6bff]'}`}>
                            {item.day}
                        </span>
                        <span className={`text-2xl md:text-3xl font-black ${active ? 'text-white' : 'text-[#4f6bff]'}`}>
                            {item.date}
                        </span>
                    </div>
                );
            })}
        </div>
    );
};

export default DateStrip;
