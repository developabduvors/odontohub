'use client';

import React from 'react';
import { FaArrowRight } from "react-icons/fa";
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import type { Doctor } from "@/types/patient";

interface DoctorInfoCardProps {
    doctor: Doctor;
}

const DoctorInfoCard: React.FC<DoctorInfoCardProps> = ({ doctor }) => {
    const router = useRouter();
    const t = useTranslations('patient.appointment_detail');

    const handleNavigate = () => {
        if (typeof window !== 'undefined') sessionStorage.setItem('gosmile:preview_doctor', JSON.stringify(doctor));
        router.push(paths.myDentist);
    };

    return (
        <div className="bg-[#4D71F8] rounded-[1.5rem] sm:rounded-[2rem] lg:rounded-[3rem] p-4 sm:p-6 lg:p-10 text-white flex gap-4 sm:gap-6 lg:gap-10 items-center shadow-lg relative overflow-hidden">
            {/* Image */}
            <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-48 lg:h-48 rounded-2xl sm:rounded-3xl lg:rounded-[2.5rem] bg-white p-1 lg:p-2 shrink-0 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={doctor.image}
                    alt={doctor.name}
                    className="w-full h-full object-cover rounded-xl sm:rounded-2xl lg:rounded-[2rem]"
                />
            </div>

            {/* Content */}
            <div className="flex-1 z-10 min-w-0">
                <h3 className="text-lg sm:text-2xl lg:text-4xl font-bold mb-2 sm:mb-3 lg:mb-4 truncate">{doctor.name}</h3>
                <div className="space-y-1 sm:space-y-2 lg:space-y-3 text-sm sm:text-base lg:text-2xl opacity-90">
                    <p className="truncate">{t('direction')}: {doctor.direction}</p>
                    <p className="truncate">{t('work_experience')}: {doctor.experience}</p>
                    <p>{t('rating')}: {doctor.rating}</p>
                </div>

                <button
                    onClick={handleNavigate}
                    className="mt-3 sm:mt-5 lg:mt-8 bg-white text-black text-xs sm:text-sm lg:text-xl font-bold py-2 sm:py-3 lg:py-4 px-4 sm:px-6 lg:px-10 rounded-full flex items-center gap-2 lg:gap-3 hover:bg-gray-100 transition-colors active:scale-95"
                >
                    {t('go_to')} <FaArrowRight size={10} className="sm:size-[12px] lg:size-[18px]" />
                </button>
            </div>
        </div>
    );
};

export default DoctorInfoCard;
