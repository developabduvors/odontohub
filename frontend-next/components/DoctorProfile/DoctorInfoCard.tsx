'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';

interface DoctorInfoCardProps {
    name: string;
    gender: string;
    birthDate: string;
    experienceYears: string;
    specialization: string;
    avatar?: string;
    onAvatarClick?: () => void;
}

const DoctorInfoCard: FC<DoctorInfoCardProps> = ({ name, gender, birthDate, experienceYears, specialization, avatar, onAvatarClick }) => {
    const t = useTranslations();
    const avatarSrc = avatar || '/assets/img/photos/Dentist.png';

    return (
        <div className="flex w-full flex-col gap-4 rounded-[24px] bg-[#5B7FFF] p-4 text-white shadow-sm sm:flex-row sm:items-center sm:gap-5 sm:p-6">
            <div
                onClick={onAvatarClick}
                className="group relative h-24 w-24 shrink-0 cursor-pointer overflow-hidden rounded-[18px] border-2 border-white/20 self-center sm:h-[120px] sm:w-[120px] sm:self-auto"
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={avatarSrc} alt="Doctor" className="h-full w-full object-cover transition-transform group-hover:scale-110" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="px-2 text-center text-[10px] font-bold">{t('doctor_profile.change_photo')}</span>
                </div>
            </div>
            <div className="min-w-0 text-center sm:text-left">
                <h2 className="mb-3 break-words text-lg font-bold tracking-tight sm:text-xl">{name}</h2>
                <div className="space-y-1 text-xs text-blue-50 sm:text-[13px]">
                    <p>{t('patient_profile.gender')}: <span className="font-medium text-white">{gender}</span></p>
                    <p>Дата рождения: <span className="font-medium text-white">{birthDate || 'Не указано'}</span></p>
                    <p>Стаж: <span className="font-medium text-white">{experienceYears || 'Не указан'}</span></p>
                    <p className="break-words">{t('doctor_profile.specialization_label')}: <span className="font-medium text-white">{specialization}</span></p>
                </div>
            </div>
        </div>
    );
};

export default DoctorInfoCard;
