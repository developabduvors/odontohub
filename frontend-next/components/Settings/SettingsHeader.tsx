'use client';

import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';
import { useSelector } from 'react-redux';
import { useTranslations } from 'next-intl';

import { Link, useRouter } from '@/i18n/navigation';
import { paths } from '@/lib/paths';
import type { RootState } from '@/store/store';
import { defaultAvatarFor } from '@/lib/avatar';

export const SettingsHeader: React.FC = () => {
  const router = useRouter();
  const t = useTranslations('common');
  const user = useSelector((state: RootState) => state.user.user);
  const gender = (user as { gender?: string | null } | null)?.gender;
  // Doktor: jinsga mos foto; bemor: jinsga mos silhuet (foydalanuvchi rasm yuklamasa).
  const headerAvatar = user?.role === 'dentist'
    ? (gender === 'female' ? '/assets/img/photos/DentistFemale.jpg' : '/assets/img/photos/Dentist.png')
    : defaultAvatarFor(gender);

  return (
    <div className="mb-6 flex flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between sm:gap-4 lg:gap-6">
      <button
        onClick={() => router.back()}
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[#dfe4ff] bg-[#eef1ff] text-[#5667ff] transition hover:bg-[#e4e9ff] sm:h-[52px] sm:w-[52px]"
      >
        <ArrowLeft size={24} />
      </button>

      <div className="relative order-3 w-full flex-1 sm:order-2 sm:max-w-4xl">
        <input
          type="text"
          placeholder={t('search')}
          className="h-[52px] w-full rounded-2xl border border-[#d9def7] bg-white px-5 pr-12 text-gray-600 outline-none transition focus:ring-2 focus:ring-[#7080ff]/20"
        />
        <Search className="absolute right-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7080ff]" />
      </div>

      <Link
        href={user?.role === 'dentist' ? paths.profile : paths.patientProfileSettings}
        className="order-2 flex h-11 w-full items-center justify-center gap-3 rounded-2xl bg-[linear-gradient(135deg,#6d83ff_0%,#5667ff_100%)] px-3 text-white shadow-[0_16px_35px_rgba(86,103,255,0.22)] transition-transform hover:-translate-y-0.5 sm:order-3 sm:h-[52px] sm:w-auto sm:justify-start sm:pr-5"
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-white/15">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={headerAvatar} alt="Profile" className="h-full w-full object-cover" />
        </div>
        <div className="hidden min-w-0 flex-col leading-tight md:flex">
          <span className="whitespace-nowrap text-sm font-bold">
            {String(user?.full_name || t('user'))}
          </span>
          <span className="text-[11px] text-white/70">
            {user?.role === 'dentist' ? t('doctor') : t('patient')}
          </span>
        </div>
      </Link>
    </div>
  );
};
