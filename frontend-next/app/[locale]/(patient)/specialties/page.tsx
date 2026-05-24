'use client';

import { useRouter } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import SpecialtiesList from '@/components/Specialties/SpecialtiesList';

const goBackIcon = '/assets/img/icons/GoBack.svg';

export default function PatientSpecialtiesPage() {
    const router = useRouter();
    const t = useTranslations();

    return (
        <div className="min-h-screen bg-[#F0F5FF] flex flex-col">
            {/* Header */}
            <div className="bg-white px-4 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
                <button
                    onClick={() => router.back()}
                    className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={goBackIcon} alt="Go back" className="w-8 h-8 md:w-10 md:h-10" />
                </button>
                <h1 className="text-xl md:text-2xl font-bold text-[#1D1D2B]">{t('patient.specialties.title')}</h1>
                <div className="w-8 md:w-10" /> {/* Spacer */}
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 no-scrollbar bg-white">
                <div className="max-w-4xl mx-auto w-full">
                    <SpecialtiesList />
                </div>
            </div>
        </div>
    );
}
