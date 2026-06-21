'use client';

import { HiArrowUp, HiArrowDown } from "react-icons/hi";
import { useTranslations } from "next-intl";
import { useMyAppointments } from "@/api/appointments";
import { useAllPatients, type Patient } from "@/api/profile";
import { useMemo } from "react";

type Stat = {
  value: number;
  titleKey: string;
  change: number;
};

export default function Analytics() {
  const t = useTranslations();
  const { data: appointments } = useMyAppointments();
  const { data: patients } = useAllPatients();

  const stats: Stat[] = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayEnd = new Date(today);
    todayEnd.setHours(23, 59, 59, 999);

    const todayAppointments = appointments?.filter((app) => {
      const appDate = new Date(app.start_time);
      return appDate >= today && appDate <= todayEnd;
    }).length || 0;

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAppointments = appointments?.filter((app) => {
      const appDate = new Date(app.start_time);
      return appDate >= firstDayOfMonth;
    }).length || 0;

    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    const weekPatients = patients?.filter((p: Patient & { created_at?: string }) => {
      if (!p.created_at) return false;
      const createdDate = new Date(p.created_at);
      return createdDate >= lastWeek;
    }).length || 0;

    return [
      { value: todayAppointments, titleKey: "dashboard.stats.consultations_today", change: 0 },
      { value: monthAppointments, titleKey: "dashboard.stats.appointments_month", change: 0 },
      { value: weekPatients, titleKey: "dashboard.stats.new_patients_week", change: 0 },
    ];
  }, [appointments, patients]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-8">
      {stats.map((item) => {
        const isPositive = item.change > 0;
        const isNegative = item.change < 0;
        const hasChange = item.change !== 0;

        const changeColor = isPositive
          ? "text-green-500"
          : isNegative
            ? "text-red-500"
            : "text-gray-400";

        return (
          <div
            key={item.titleKey}
            className="min-h-[120px] sm:min-h-[140px] bg-white rounded-xl sm:rounded-2xl px-5 sm:px-6 py-5 sm:py-6 shadow-md flex flex-col justify-center items-center text-center"
          >
            <div className="flex items-center justify-center mb-1 sm:mb-3 w-full">
              <h2 className="text-2xl sm:text-5xl font-bold text-gray-900">
                {item.value}
              </h2>

              {hasChange && (
                <div className={`flex items-center gap-1 ${changeColor}`}>
                  <span className="text-sm sm:text-lg font-bold">
                    {isPositive ? `+${item.change}` : item.change}
                  </span>
                  {isPositive && <HiArrowUp className="w-4 h-4 sm:w-5 sm:h-5" />}
                  {isNegative && <HiArrowDown className="w-4 h-4 sm:w-5 sm:h-5" />}
                </div>
              )}
            </div>

            <p className="text-gray-600 text-[11px] sm:text-sm font-medium leading-tight">
              {t(item.titleKey)}
            </p>
          </div>
        );
      })}
    </div>
  );
}
