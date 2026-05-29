'use client';

import { useState, useMemo, type FC } from "react";
import { ChevronLeft, ChevronRight, MoreVertical } from "lucide-react";
import { useTranslations } from "next-intl";

import { useRouter } from "@/i18n/navigation";
import { useMyAppointments } from "@/api/appointments";

const Section: FC = () => {
  const t = useTranslations();
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const router = useRouter();

  const { data: apiAppointments, isLoading } = useMyAppointments();

  const effectiveDate = useMemo(() => {
    if (currentDate) return currentDate;
    if (!apiAppointments || apiAppointments.length === 0) return new Date();
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const upcoming = apiAppointments
      .map(a => new Date(a.start_time))
      .filter(d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x >= today; })
      .sort((a, b) => a.getTime() - b.getTime());
    return upcoming.length > 0 ? upcoming[0] : new Date();
  }, [currentDate, apiAppointments]);

  const appointments = useMemo(() => {
    if (!apiAppointments || !Array.isArray(apiAppointments)) return [];

    const selectedDateStr = `${effectiveDate.getFullYear()}-${(effectiveDate.getMonth() + 1).toString().padStart(2, '0')}-${effectiveDate.getDate().toString().padStart(2, '0')}`;

    return apiAppointments
      .filter(app => {
        if (app.status === 'cancelled') return false;
        const d = new Date(app.start_time);
        const dStr = `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
        return dStr === selectedDateStr;
      })
      .map(app => {
        const start = new Date(app.start_time);
        const end = new Date(app.end_time);
        const startTime = `${start.getHours().toString().padStart(2, '0')}:${start.getMinutes().toString().padStart(2, '0')}`;
        const endTime = `${end.getHours().toString().padStart(2, '0')}:${end.getMinutes().toString().padStart(2, '0')}`;
        return {
          id: app.id,
          name: app.patient_name || 'Пациент',
          time: `${startTime}-${endTime}`
        };
      });
  }, [apiAppointments, effectiveDate]);

  const goToPreviousDay = () => {
    const d = new Date(effectiveDate);
    d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const goToNextDay = () => {
    const d = new Date(effectiveDate);
    d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const formatDate = (date: Date) => {
    const dayName = t(`dashboard.appointments_card.weekdays.${date.getDay()}`);
    const day = date.getDate();
    const month = t(`dashboard.appointments_card.months.${date.getMonth()}`);
    return `${month} ${day}, ${dayName}`;
  };

  return (
    <div className="w-full rounded-2xl bg-white p-4 shadow-sm sm:rounded-3xl sm:p-6 xl:sticky xl:top-6">
      <h2 className="text-lg sm:text-2xl font-bold text-gray-900">{t('dashboard.appointments_card.title')}</h2>

      <div className="flex items-center justify-between">
        <button onClick={goToPreviousDay} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
        <div className="text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 font-medium mb-0.5">{t('dashboard.appointments_card.today')}</p>
          <p className="text-xs sm:text-sm font-bold text-gray-900">{formatDate(effectiveDate)}</p>
        </div>
        <button onClick={goToNextDay} className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8 sm:py-10">
          <div className="animate-spin rounded-full h-7 w-7 sm:h-8 sm:w-8 border-b-2 border-gray-900" />
        </div>
      ) : appointments.length > 0 ? (
        <div className="flex flex-col gap-0 mt-1 sm:mt-2">
          {appointments.map((apt, index) => (
            <div
              key={apt.id}
              onClick={() => router.push('/appointments')}
              className={`flex items-center justify-between py-3 sm:py-4 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors ${
                index !== appointments.length - 1 ? "border-b border-gray-100" : ""
              }`}
            >
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center font-bold text-gray-600 text-sm sm:text-base">
                  {apt.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-xs sm:text-sm text-gray-900">{apt.name}</p>
                  <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5">{apt.time}</p>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); router.push('/appointments'); }}
                className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 sm:py-10">
          <p className="text-gray-400 font-medium text-sm sm:text-base">Нет записей</p>
          <p className="text-gray-300 text-xs sm:text-sm mt-1">На выбранную дату записей нет</p>
        </div>
      )}
    </div>
  );
};

export default Section;
