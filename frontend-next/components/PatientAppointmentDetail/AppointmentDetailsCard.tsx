'use client';

import React from 'react';
import { useTranslations } from 'next-intl';

interface AppointmentDetailsCardProps {
    details: {
        status: string;
        date: string;
        duration: string;
        tip?: string; // Mapped to "Naznachenie" or similar? Screenshot says "Назначения: Пусто"
        notes?: string;
    };
}

const AppointmentDetailsCard: React.FC<AppointmentDetailsCardProps> = ({ details }) => {
    const t = useTranslations('patient.appointment_detail');
    return (
        <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[2.5rem] border-2 border-[#1D1D2B] p-4 sm:p-6 lg:p-10 flex flex-col gap-3 sm:gap-4 lg:gap-6">
            <div className="flex flex-col gap-2 sm:gap-3 lg:gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-3">
                    <span className="text-[#1D1D2B] font-bold text-sm sm:text-base lg:text-2xl">{t('status_label')}:</span>
                    <span className="text-[#1D1D2B] font-medium text-sm sm:text-base lg:text-2xl">{details.status}</span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 lg:gap-3">
                    <span className="text-[#1D1D2B] font-bold text-sm sm:text-base lg:text-2xl">{t('when_label')}:</span>
                    <span className="text-[#1D1D2B] font-medium text-sm sm:text-base lg:text-2xl">{details.date}</span>
                </div>
                {details.notes && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2 lg:gap-3">
                        <span className="text-[#1D1D2B] font-bold text-sm sm:text-base lg:text-2xl shrink-0">{t('notes_label')}:</span>
                        <span className="text-[#1D1D2B] font-medium text-sm sm:text-base lg:text-2xl">{details.notes}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AppointmentDetailsCard;
