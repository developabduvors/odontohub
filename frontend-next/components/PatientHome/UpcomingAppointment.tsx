'use client';

import { ArrowUpRight, Users, Calendar } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { useMyAppointments } from '@/api/appointments';

const DENTIST_IMG = '/assets/img/photos/Dentist.png';

export default function UpcomingAppointment() {
  const t = useTranslations();
  const router = useRouter();
  const { data: appointments, isLoading } = useMyAppointments();

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-48 bg-gray-200 rounded-lg" />
        <div className="h-48 bg-gray-100 rounded-4xl" />
      </div>
    );
  }

  if (!appointments || appointments.length === 0) return null;

  const sorted = [...appointments]
    .filter(
      (a) =>
        (a.status === 'pending' || a.status === 'confirmed' || a.status === 'moved') &&
        new Date(a.start_time).getTime() > new Date().getTime()
    )
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

  const upcoming = sorted[0];
  if (!upcoming) return null;

  const startTime = new Date(upcoming.start_time);
  const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;
  const dateStr = startTime.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });

  const getRemainingTime = (target: Date) => {
    const diff = target.getTime() - new Date().getTime();
    const mins = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}д ${hours % 24}ч`;
    if (hours > 0) return `${hours}ч ${mins % 60}м`;
    return `${mins}м`;
  };

  const remainingTimeStr = getRemainingTime(startTime);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl md:text-3xl font-extrabold text-gray-900 tracking-tight">{t('patient.home.upcoming')}</h2>
        <button
          onClick={() => router.push('/calendar')}
          className="text-blue-600 font-bold text-sm md:text-lg flex items-center gap-1 hover:gap-2 transition-all"
        >
          {t('analytics.filter.all')}
          <ArrowUpRight size={20} />
        </button>
      </div>
      <div className="bg-blue-600 rounded-4xl p-6 lg:p-10 text-white space-y-6 shadow-xl shadow-blue-500/20 relative overflow-hidden group">
        <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>

        <div className="flex flex-col md:flex-row md:items-center gap-6 lg:gap-10 relative z-10">
          <div className="w-20 h-20 lg:w-32 lg:h-32 rounded-2xl md:rounded-4xl overflow-hidden bg-white/20 ring-4 ring-white/10 shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={DENTIST_IMG}
              alt="Doctor"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
          </div>
          <div className="flex-1 space-y-2 lg:space-y-4">
            <h3 className="text-xl lg:text-4xl font-black">{upcoming.service || t('patient.appointments.type_extraction')}</h3>
            <div className="flex items-center gap-2 opacity-90 text-sm lg:text-xl">
              <Users size={20} className="lg:size-6" />
              <span className="font-bold">{upcoming.dentist_name || 'Махмуд Пулатов'}</span>
            </div>
            <p className="text-xs lg:text-base opacity-75 font-bold tracking-wide uppercase">{t('patient.appointments.specialty_general')}</p>
          </div>
          <div className="hidden md:block">
            <button
              onClick={() => router.push(`/appointment/${upcoming.id}`)}
              className="bg-white text-blue-600 px-8 py-4 rounded-2xl lg:rounded-3xl font-black text-sm lg:text-lg hover:bg-blue-50 transition-all active:scale-95"
            >
              {t('patient.home.more_details')}
            </button>
          </div>
        </div>

        <div className="bg-white/15 backdrop-blur-xl rounded-2xl lg:rounded-3xl py-4 px-6 lg:px-10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs lg:text-lg font-black border border-white/10 relative z-10">
          <div className="flex items-center gap-3">
            <Calendar size={16} className="lg:size-6" />
            <span>{dateStr}, {timeStr}</span>
          </div>
          <div className="w-px h-6 bg-white/20 hidden sm:block"></div>
          <div className="flex items-center gap-3 text-blue-50">
            <span className="opacity-80">До приёма:</span>
            <span className="font-mono text-sm lg:text-xl tracking-wider bg-white/20 px-4 py-1.5 rounded-xl">
              {remainingTimeStr}
            </span>
          </div>
        </div>

        <div className="md:hidden relative z-10">
          <button
            onClick={() => router.push(`/appointment/${upcoming.id}`)}
            className="w-full bg-white text-blue-600 py-3 rounded-2xl font-black text-sm active:scale-95"
          >
            {t('patient.home.more_details')}
          </button>
        </div>
      </div>
    </div>
  );
}
