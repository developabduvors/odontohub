'use client';

import { type FC, useState } from 'react';
import { Plus, Edit2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ScheduleCardProps {
    workStart?: string;
    startMinute?: string;
    workEnd?: string;
    endMinute?: string;
    onSave?: (newData: Record<string, string>) => void;
}

const ScheduleCard: FC<ScheduleCardProps> = ({
    workStart = '08',
    startMinute = '00',
    workEnd = '16',
    endMinute = '00',
    onSave
}) => {
    const t = useTranslations();
    const [isEditing, setIsEditing] = useState<boolean>(false);
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = ['00', '15', '30', '45'];

    const handleSave = (field: string, value: string) => {
        if (onSave) {
            onSave({ [field]: value });
        }
    };

    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-50 h-full">
            <h3 className="text-2xl font-bold text-[#1E2532] mb-8">{t('doctor_profile.schedule')}</h3>

            <div className="space-y-8">
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <span className="font-bold text-[#1E2532] text-sm">{t('doctor_profile.every_day')}</span>
                    </div>
                    <div className="flex gap-4 items-center">
                        <div className="flex-1 bg-[#F5F7FA] py-4 rounded-[20px] px-6 flex items-center justify-between border border-gray-100 transition-all hover:border-blue-200">
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-full justify-center">
                                    <div className="flex items-center gap-1">
                                        <div className="relative group/select">
                                            <select
                                                value={workStart}
                                                onChange={(e) => handleSave('workStart', e.target.value)}
                                                className="bg-white border border-blue-100 rounded-lg px-2 py-1 font-bold text-[#1E2532] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 pr-6"
                                            >
                                                {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-400"></div>
                                            </div>
                                        </div>
                                        <span className="text-[#1E2532] font-bold">:</span>
                                        <div className="relative group/select">
                                            <select
                                                value={startMinute}
                                                onChange={(e) => handleSave('startMinute', e.target.value)}
                                                className="bg-white border border-blue-100 rounded-lg px-2 py-1 font-bold text-[#1E2532] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 pr-6"
                                            >
                                                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-400"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <span className="text-[#1E2532] font-bold mx-2">—</span>

                                    <div className="flex items-center gap-1">
                                        <div className="relative group/select">
                                            <select
                                                value={workEnd}
                                                onChange={(e) => handleSave('workEnd', e.target.value)}
                                                className="bg-white border border-blue-100 rounded-lg px-2 py-1 font-bold text-[#1E2532] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 pr-6"
                                            >
                                                {hours.map(h => <option key={h} value={h}>{h}</option>)}
                                            </select>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-400"></div>
                                            </div>
                                        </div>
                                        <span className="text-[#1E2532] font-bold">:</span>
                                        <div className="relative group/select">
                                            <select
                                                value={endMinute}
                                                onChange={(e) => handleSave('endMinute', e.target.value)}
                                                className="bg-white border border-blue-100 rounded-lg px-2 py-1 font-bold text-[#1E2532] appearance-none focus:outline-none focus:ring-2 focus:ring-blue-100 pr-6"
                                            >
                                                {minutes.map(m => <option key={m} value={m}>{m}</option>)}
                                            </select>
                                            <div className="absolute right-1 top-1/2 -translate-y-1/2 pointer-events-none">
                                                <div className="w-0 h-0 border-l-4 border-l-transparent border-r-4 border-r-transparent border-t-4 border-t-gray-400"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-center w-full gap-2 font-bold text-[#1E2532] text-lg">
                                    <span>{workStart}:{startMinute}</span>
                                    <span className="text-gray-300">—</span>
                                    <span>{workEnd}:{endMinute}</span>
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isEditing ? 'bg-[#5B7FFF] text-white shadow-lg shadow-blue-100' : 'bg-[#F5F8FF] text-[#5B7FFF] hover:bg-blue-50'}`}
                        >
                            <Edit2 className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                <div>
                    <span className="font-bold text-[#1E2532] text-sm mb-4 block">{t('doctor_profile.weekend')}</span>
                    <button className="w-full bg-[#5B7FFF] text-white py-4 rounded-[22px] font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-100 hover:bg-blue-600 transition-all">
                        <Plus className="w-4 h-4" strokeWidth={3} /> {t('doctor_profile.add')}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ScheduleCard;
