'use client';

import React from 'react';
import { useRouter } from '@/i18n/navigation';
import { useTranslations } from "next-intl";
import { FiArrowUpRight } from 'react-icons/fi';
import { paths } from '@/lib/paths';
import { useSpecializationCounts } from '@/api/profile';

interface Specialty {
    id: string;
    name: string;
    description: string;
    count: number;
}

const SpecialtiesList: React.FC = () => {
    const router = useRouter();
    const t = useTranslations();
    const { data: counts } = useSpecializationCounts();

    const specialtyIds = [
        'therapist', 'surgeon', 'orthopedist', 'orthodontist',
        'periodontist', 'pediatric', 'hygienist', 'aesthetic', 'general'
    ];

    const specialties: Specialty[] = specialtyIds.map(id => ({
        id: id,
        name: t(`patient.specialties.items.${id}.name`),
        description: t(`patient.specialties.items.${id}.desc`),
        count: (counts && typeof counts[id] === 'number') ? counts[id] : 0
    }));

    const handleView = (specialty: Specialty) => {
        // Navigate to doctors list, filtered by specialty and passing the stable ID
        if (typeof window !== 'undefined') {
            sessionStorage.setItem('gosmile:doctors_specialty', specialty.id);
        }
        router.push(paths.doctors);
    };

    return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-10">
            {specialties.map((item) => (
                <div
                    key={item.id}
                    className="bg-white rounded-[24px] sm:rounded-[32px] p-5 sm:p-6 lg:p-8 shadow-sm border border-white hover:border-blue-100 hover:shadow-md transition-all group"
                >
                    <div className="flex flex-col gap-3 sm:gap-4">
                        <div>
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#1D1D2B] mb-2 sm:mb-3">
                                {item.name}
                            </h3>
                            <p className="text-gray-500 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl">
                                {item.description}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-2 sm:mt-4">
                            <button
                                onClick={() => handleView(item)}
                                className="bg-[#4D71F8] hover:bg-[#3b5cd9] text-white py-2.5 sm:py-3 px-6 sm:px-8 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 group-hover:shadow-lg group-hover:shadow-blue-500/20 self-start sm:self-auto w-full sm:w-auto"
                            >
                                <span className="text-sm sm:text-base">{t('patient.specialties.view_btn')}</span>
                                <FiArrowUpRight className="text-lg sm:text-xl" />
                            </button>

                            <span className="text-[#1D1D2B] font-bold text-xs sm:text-sm lg:text-base whitespace-nowrap">
                                {t('patient.specialties.found_count', { count: item.count })}
                            </span>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default SpecialtiesList;
