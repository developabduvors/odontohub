'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { StickyNote } from 'lucide-react';

export type AppointmentStatus = 'completed' | 'cancelled' | 'rescheduled' | 'in_progress' | 'in_queue' | 'pending';

interface AppointmentCardProps {
    time: string;
    service: string;
    patientName: string;
    status: AppointmentStatus;
    notes?: string | null;
    onClick?: () => void;
}

const statusStyles: Record<AppointmentStatus, string> = {
    'completed': 'border-[#00e396] text-[#00e396]',
    'cancelled': 'border-[#ff4560] text-[#ff4560]',
    'rescheduled': 'border-[#feb019] text-[#feb019]',
    'in_progress': 'border-[#4f6bff] text-[#4f6bff]',
    'in_queue': 'border-[#6c757d] text-[#6c757d]',
    'pending': 'border-[#feb019] text-[#feb019]',
};

const AppointmentCard: React.FC<AppointmentCardProps> = ({ time, service, patientName, status, notes, onClick }) => {
    const t = useTranslations();
    return (
        <div
            onClick={onClick}
            className="bg-white rounded-[24px] md:rounded-[32px] p-5 md:p-6 shadow-sm hover:shadow-xl transition-all duration-300 group cursor-pointer active:scale-95 flex flex-col h-full"
        >
            <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-black text-[#1a1f36]">{time}</span>
                <span className={`px-4 py-1 rounded-[12px] text-[11px] font-bold border ${statusStyles[status]}`}>
                    {t(`appointments.statuses.${status}`)}
                </span>
            </div>
            <div className="space-y-1 mb-3">
                <h4 className="text-lg font-black text-[#1a1f36] leading-tight group-hover:text-[#4f6bff] transition-colors">
                    {service}
                </h4>
                <p className="text-[12px] font-bold text-[#1a1f36]">{patientName}</p>
            </div>

            {notes && (
                <div className="mt-auto pt-3 border-t border-gray-50 flex items-start gap-2">
                    <StickyNote size={14} className="text-gray-300 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-gray-400 font-medium italic line-clamp-2 leading-snug">
                        {notes}
                    </p>
                </div>
            )}
        </div>
    );
};

export default AppointmentCard;
