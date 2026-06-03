'use client';

import React from 'react';
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useTranslations } from 'next-intl';

interface BookingCalendarProps {
    selectedDate: Date | null;
    onDateChange: (date: Date) => void;
}

const BookingCalendar: React.FC<BookingCalendarProps> = ({ selectedDate, onDateChange }) => {
    const t = useTranslations('booking');
    // Basic calendar logic (simplified for this task, can be expanded)
    const currentDate = new Date();
    const [currentMonth, setCurrentMonth] = React.useState(currentDate);

    const daysInMonth = (date: Date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const firstDayOfMonth = (date: Date) => {
        // 0 = Sunday, 1 = Monday. Goal: 0 = Mon, 6 = Sun
        let day = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
        return day === 0 ? 6 : day - 1;
    };

    const monthNames = Array.from({ length: 12 }, (_, i) => t(`months.${i}`));

    const weekDays = Array.from({ length: 7 }, (_, i) => t(`weekdays.${i}`));

    const handlePrevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    const handleNextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
    };

    const renderDays = () => {
        const totalDays = daysInMonth(currentMonth);
        const startDay = firstDayOfMonth(currentMonth);
        const days = [];

        // Empty cells for days before start of month
        for (let i = 0; i < startDay; i++) {
            days.push(<div key={`empty-${i}`} className="h-10 w-10"></div>);
        }

        for (let i = 1; i <= totalDays; i++) {
            const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), i);
            const isSelected = selectedDate &&
                date.getDate() === selectedDate.getDate() &&
                date.getMonth() === selectedDate.getMonth() &&
                date.getFullYear() === selectedDate.getFullYear();

            // Mock weekend styling just for visual variety if needed, or simple check
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;

            days.push(
                <button
                    key={i}
                    onClick={() => onDateChange(date)}
                    className={`h-10 w-10 flex items-center justify-center rounded-full text-lg font-medium transition-colors
                        ${isSelected ? 'bg-blue-500 text-white shadow-md' : 'hover:bg-gray-100'}
                        ${!isSelected && isWeekend ? 'text-gray-400' : 'text-gray-900'}
                    `}
                >
                    {i}
                </button>
            );
        }
        return days;
    };

    return (
        <div className="bg-white rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h2>
                <div className="flex gap-2">
                    <button onClick={handlePrevMonth} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                        <FaChevronLeft className="text-gray-600 text-xs" />
                    </button>
                    <button onClick={handleNextMonth} className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200">
                        <FaChevronRight className="text-gray-600 text-xs" />
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-y-4 justify-items-center mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-gray-900 font-bold text-sm">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                {renderDays()}
            </div>
        </div>
    );
};

export default BookingCalendar;
