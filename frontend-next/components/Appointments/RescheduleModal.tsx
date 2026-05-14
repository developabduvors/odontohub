'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface RescheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (startTime: string, endTime: string) => void;
    currentStartTime: string;
}

const RescheduleModal: React.FC<RescheduleModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    currentStartTime
}) => {
    const currentDate = new Date(currentStartTime);
    const [date, setDate] = useState(currentDate.toISOString().split('T')[0]);
    const [time, setTime] = useState(
        `${currentDate.getHours().toString().padStart(2, '0')}:${currentDate.getMinutes().toString().padStart(2, '0')}`
    );

    if (!isOpen) return null;

    const handleConfirm = () => {
        const [hours, minutes] = time.split(':');
        const startDateTime = new Date(date);
        startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);

        const endDateTime = new Date(startDateTime);
        endDateTime.setHours(startDateTime.getHours() + 1);

        onConfirm(startDateTime.toISOString(), endDateTime.toISOString());
    };

    return (
        <div
            onClick={onClose}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        >
            <div
                onClick={(e) => e.stopPropagation()}
                className="bg-white w-full max-w-[500px] rounded-[24px] shadow-2xl animate-in zoom-in-95 duration-300 p-8"
            >
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-black text-[#1a1f36]">Перенести приём</h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-gray-600 font-bold mb-2">Дата</label>
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-[16px] font-bold focus:border-[#4f6bff] focus:outline-none transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-600 font-bold mb-2">Время</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-[16px] font-bold focus:border-[#4f6bff] focus:outline-none transition-colors"
                        />
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 bg-gray-100 text-gray-600 text-lg font-black rounded-[16px] hover:bg-gray-200 transition-all active:scale-[0.98]"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={handleConfirm}
                            className="flex-1 py-4 bg-[#feb019] text-white text-lg font-black rounded-[16px] shadow-lg shadow-[#feb019]/30 hover:bg-[#e09d15] transition-all active:scale-[0.98]"
                        >
                            Перенести
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RescheduleModal;
