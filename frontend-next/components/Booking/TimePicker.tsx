'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface TimePickerProps {
    selectedTime: string;
    onTimeChange: (time: string) => void;
}

const TimePicker: React.FC<TimePickerProps> = ({ selectedTime, onTimeChange }) => {
    // Mock time logic - mimicking the visual of two inputs or a single time input stylized
    // The screenshot shows "___ : ___", implying Hour : Minute selection.
    const t = useTranslations('booking');

    const [hour, setHour] = React.useState("");
    const [minute, setMinute] = React.useState("");

    const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        const num = parseInt(val);
        if (val && (num < 0 || num > 23)) return;
        setHour(val);
        updateTime(val, minute);
    };

    const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length > 2) val = val.slice(0, 2);
        const num = parseInt(val);
        if (val && (num < 0 || num > 59)) return;
        setMinute(val);
        updateTime(hour, val);
    };

    const updateTime = (h: string, m: string) => {
        if (h && m) {
            onTimeChange(`${h}:${m}`);
        } else {
            onTimeChange("");
        }
    };

    return (
        <div>
            <h2 className="text-lg font-bold mb-2">{t('pick_time')}</h2>
            <div className="bg-white rounded-3xl p-4 h-20 shadow-sm flex items-center justify-center gap-1">
                <input
                    type="text"
                    inputMode="numeric"
                    value={hour}
                    onChange={handleHourChange}
                    placeholder="00"
                    className="w-16 text-center text-3xl font-bold bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none placeholder-gray-300 text-gray-800"
                />
                <span className="text-3xl font-bold text-gray-300 pb-2">:</span>
                <input
                    type="text"
                    inputMode="numeric"
                    value={minute}
                    onChange={handleMinuteChange}
                    placeholder="00"
                    className="w-16 text-center text-3xl font-bold bg-transparent border-b-2 border-gray-400 focus:border-blue-500 outline-none placeholder-gray-300 text-gray-800"
                />
            </div>
        </div>
    );
};

export default TimePicker;
