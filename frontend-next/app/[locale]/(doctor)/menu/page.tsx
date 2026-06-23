'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import DoctorPageShell from '@/components/Layout/DoctorPageShell';
import Hero from '@/components/Bosh sahifa/Hero';
import NewPatients from '@/components/Bosh sahifa/NewPatients';
import Analytics from '@/components/Bosh sahifa/Analytics';
import PatientSearch from '@/components/Bosh sahifa/PatientSearch';
import Tezroq from '@/components/Bosh sahifa/Tezroq';
import Section from '@/components/Bosh sahifa/Section';

export default function MenuPage() {
  const t = useTranslations();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <DoctorPageShell
      badge={t('dashboard.shell.badge')}
      title="GoSmile"
      accent={t('dashboard.shell.accent')}
      description={t('dashboard.shell.description')}
      contentClassName="p-0"
    >
      <div>
        <Hero onSearch={setSearchQuery} />
        <div className="px-3 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          {/* Qidiruv natijasi to'g'ridan-to'g'ri qidiruv maydoni ostida ko'rinsin
              (bo'sh so'rovda PatientSearch null qaytaradi — joy egallamaydi) */}
          <PatientSearch searchQuery={searchQuery} />
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6">
            <div className="xl:col-span-8 flex flex-col space-y-4 sm:space-y-6 min-w-0">
              <Analytics />
              <NewPatients />
              <Tezroq />
            </div>
            <div className="xl:col-span-4 min-w-0">
              <Section />
            </div>
          </div>
        </div>
      </div>
    </DoctorPageShell>
  );
}
