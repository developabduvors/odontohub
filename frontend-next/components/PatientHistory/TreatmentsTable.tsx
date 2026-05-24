'use client';

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import type { MedcardAppointment } from "@/api/medcard";

interface TreatmentGroup {
  service: string;
  appointments: MedcardAppointment[];
  appointmentCount: number;
  periodLabel: string;
  durationDays: number;
}

interface TreatmentsTableProps {
  treatments: TreatmentGroup[];
}

const statusClass: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700",
  confirmed: "bg-blue-100 text-blue-700",
  pending: "bg-amber-100 text-amber-700",
  moved: "bg-purple-100 text-purple-700",
  cancelled: "bg-red-100 text-red-700",
};

const statusLabel: Record<string, string> = {
  completed: "Tugallangan",
  confirmed: "Tasdiqlangan",
  pending: "Kutilmoqda",
  moved: "Ko'chirilgan",
  cancelled: "Bekor qilingan",
};

const visitLabel = (visitType?: string | null) =>
  visitType === "primary" || visitType === "initial" ? "1-ko'rik" : "Davomiy";

const formatDate = (iso: string) => {
  const utcValue = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
  return new Date(utcValue).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const TreatmentCard = ({ treatment }: { treatment: TreatmentGroup }) => {
  const [open, setOpen] = useState(true);

  return (
    <div className="rounded-[2rem] border border-gray-100 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((value) => !value)}
        className="w-full px-5 md:px-6 py-5 flex items-center justify-between gap-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="grid grid-cols-1 md:grid-cols-[1.3fr,1fr,auto] gap-3 flex-1 items-center">
          <div>
            <p className="text-lg md:text-2xl font-black text-gray-900">{treatment.service}</p>
            <p className="text-sm text-gray-500 mt-1">{treatment.periodLabel}</p>
          </div>
          <div className="text-sm md:text-base font-bold text-gray-500">
            {treatment.durationDays > 0 ? `${treatment.durationDays} kun davom etgan` : "Bir kunda yakunlangan"}
          </div>
          <div className="inline-flex justify-center rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
            {treatment.appointmentCount} priyom
          </div>
        </div>
        {open ? <ChevronUp className="text-gray-400 shrink-0" /> : <ChevronDown className="text-gray-400 shrink-0" />}
      </button>

      {open && (
        <div className="px-5 md:px-6 pb-6">
          <div className="border-t border-gray-100 pt-5 space-y-4">
            {treatment.appointments.map((appointment, index) => {
              const isLast = index === treatment.appointments.length - 1;

              return (
                <div key={appointment.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="mt-1 h-3 w-3 rounded-full bg-blue-500" />
                    {!isLast && <div className="mt-1 w-0.5 flex-1 bg-gray-200" />}
                  </div>

                  <div className={`flex-1 ${!isLast ? "pb-4" : ""}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm md:text-base font-black text-[#1d1d2b]">{formatDate(appointment.start_time)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusClass[appointment.status] || "bg-gray-100 text-gray-600"}`}>
                        {statusLabel[appointment.status] || appointment.status}
                      </span>
                      <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
                        {visitLabel(appointment.visit_type)}
                      </span>
                    </div>

                    {appointment.dentist_name && (
                      <p className="mt-2 text-sm font-semibold text-gray-500">Shifokor: {appointment.dentist_name}</p>
                    )}
                    {appointment.diagnosis && (
                      <p className="mt-2 text-sm text-gray-700"><b>Tashxis:</b> {appointment.diagnosis}</p>
                    )}
                    {appointment.treatment_notes && (
                      <p className="mt-1 text-sm text-gray-600">{appointment.treatment_notes}</p>
                    )}
                    {appointment.notes && !appointment.treatment_notes && (
                      <p className="mt-1 text-sm text-gray-600">{appointment.notes}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const TreatmentsTable = ({ treatments }: TreatmentsTableProps) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
        <div>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight text-blue-900">Davolanish jarayonlari</h2>
          <p className="text-sm md:text-base text-gray-500 mt-2">
            Implantatsiya kabi davomiy ishlarda nechta priyom bo'lgani va qancha kun davom etgani shu yerda ko'rinadi.
          </p>
        </div>
      </div>

      {treatments.length === 0 ? (
        <div className="rounded-[2rem] border border-dashed border-gray-200 bg-gray-50 px-6 py-10 text-center text-gray-500 font-semibold">
          Hali davolanish tarixi shakllanmagan.
        </div>
      ) : (
        <div className="space-y-4">
          {treatments.map((treatment) => (
            <TreatmentCard key={`${treatment.service}-${treatment.appointments[0]?.id ?? 0}`} treatment={treatment} />
          ))}
        </div>
      )}
    </div>
  );
};

export default TreatmentsTable;
