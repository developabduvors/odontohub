'use client';

import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import type { Service } from '@/types/patient';

const RASM = '/assets/img/icons/image 4 (1).svg';
const RASM2 = '/assets/img/icons/image 4.svg';
const RASM3 = '/assets/img/icons/image 4 (2).svg';
const RASM4 = '/assets/img/icons/image 4 (3).svg';

export default function ServicesGrid() {
  const t = useTranslations();
  const router = useRouter();

  const services: Service[] = [
    { icon: RASM, label: t('patient.home.services_all') },
    { icon: RASM2, label: t('patient.home.services_treatment') },
    { icon: RASM3, label: t('patient.home.services_hygiene') },
    { icon: RASM4, label: t('patient.home.services_surgery') },
  ];

  const goToDoctors = (label: string) => {
    const specialty = label === t('patient.home.services_all') ? '' : label;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('gosmile:doctors_specialty', specialty);
    }
    router.push(paths.doctors);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{t('patient.home.services')}</h2>
        <button
          onClick={() => router.push(paths.specialties)}
          className="p-2.5 bg-white rounded-full shadow-lg text-blue-600 hover:scale-110 active:scale-95 transition-all"
        >
          <Plus size={24} />
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 md:gap-6 lg:gap-8">
        {services.map((service, idx) => (
          <div
            key={idx}
            onClick={() => goToDoctors(service.label)}
            className="bg-white rounded-4xl shadow-sm hover:shadow-xl transition-all duration-300 p-6 md:p-8 lg:p-12 flex flex-col items-center justify-center gap-4 md:gap-6 cursor-pointer group border border-gray-100 hover:border-gray-200 active:scale-95"
          >
            <div className="flex items-center justify-center text-gray-700 group-hover:text-blue-600 transition-colors">
              <div className="scale-[1.5] md:scale-[2] lg:scale-[2.5]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="w-[36px] h-[36px]" src={service.icon} alt="" />
              </div>
            </div>
            <span className="text-xs md:text-sm lg:text-lg text-gray-700 font-extrabold text-center group-hover:text-blue-600 transition-colors uppercase tracking-wider">
              {service.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
