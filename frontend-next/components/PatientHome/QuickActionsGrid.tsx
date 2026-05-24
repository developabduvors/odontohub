'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { paths } from '@/lib/paths';
import type { QuickAction } from '@/types/patient';

const SCROLL_UP = '/assets/img/icons/Scroll Up.svg';
const DOCTOR = '/assets/img/icons/healthicons_doctor-male.svg';
const CONSULTATION = '/assets/img/icons/Consultation.svg';

export default function QuickActionsGrid() {
  const t = useTranslations();
  const quickActions: QuickAction[] = [
    { label: t('patient.home.action_book'), icon: SCROLL_UP, color: 'bg-blue-600 text-white', path: paths.booking },
    { label: t('patient.home.action_doctors'), icon: DOCTOR, color: 'bg-white text-blue-600', path: paths.doctors },
    { label: t('patient.home.action_my_dentist'), icon: CONSULTATION, color: 'bg-emerald-400 text-white', path: paths.myDentist },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {quickActions.map((action, idx) => (
        <Link
          key={idx}
          href={action.path}
          className={`${action.color} rounded-4xl p-6 md:p-10 flex flex-col justify-between min-h-[160px] md:min-h-[220px] lg:min-h-[280px] shadow-md transition-all duration-500 border border-transparent hover:scale-[1.02]`}
        >
          <div className="flex flex-col items-center justify-center py-2 h-full">
            <div className="flex mb-4 lg:mb-8">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="w-[80px] h-[80px] lg:w-[120px] lg:h-[120px] object-contain" src={action.icon} alt="" />
            </div>
            <div className="flex items-center justify-center">
              <span className="text-base md:text-xl lg:text-2xl font-black leading-tight text-center tracking-tight">
                {action.label}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
