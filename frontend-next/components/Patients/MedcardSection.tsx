'use client';

import { useState } from 'react';
import { AlertTriangle, Pill, Clock, ChevronDown, ChevronUp } from 'lucide-react';

import { usePatientMedcard, type MedcardAppointment } from '@/api/medcard';

const toUTC = (iso: string) => (iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');

const fmt = (iso: string) =>
  new Date(toUTC(iso)).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

const diffDays = (a: string, b: string) =>
  Math.round((new Date(toUTC(b)).getTime() - new Date(toUTC(a)).getTime()) / 86_400_000);

const severityColor = (s: string | null) => {
  if (s === 'high') return 'bg-red-100 text-red-700 border-red-200';
  if (s === 'medium') return 'bg-yellow-100 text-yellow-700 border-yellow-200';
  return 'bg-green-100 text-green-700 border-green-200';
};

const statusLabel: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Tugallangan', cls: 'bg-green-100 text-green-700' },
  confirmed: { label: 'Tasdiqlangan', cls: 'bg-blue-100 text-blue-700' },
  pending: { label: 'Kutilmoqda', cls: 'bg-yellow-100 text-yellow-700' },
  cancelled: { label: 'Bekor', cls: 'bg-red-100 text-red-700' },
  moved: { label: "Ko'chirildi", cls: 'bg-purple-100 text-purple-700' },
};

const visitLabel = (vt: string | null) =>
  vt === 'primary' || vt === 'initial' ? "1-ko'rik" : 'Davomiy';

interface TimelineGroupProps {
  service: string;
  items: MedcardAppointment[];
}

const TimelineGroup = ({ service, items }: TimelineGroupProps) => {
  const [open, setOpen] = useState(true);
  const sorted = [...items].sort(
    (a, b) => new Date(toUTC(a.start_time)).getTime() - new Date(toUTC(b.start_time)).getTime()
  );
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  const totalDays = sorted.length > 1 ? diffDays(first.start_time, last.start_time) : 0;

  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold text-gray-800">{service || "Xizmat ko'rsatilmagan"}</span>
          <span className="text-xs bg-white border border-gray-200 text-gray-500 rounded-full px-2 py-0.5">
            {sorted.length} priyom
          </span>
          {totalDays > 0 && <span className="text-xs text-gray-400">{totalDays} kun</span>}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-gray-400" />
        ) : (
          <ChevronDown size={16} className="text-gray-400" />
        )}
      </button>

      {open && (
        <div className="px-4 py-3 space-y-0">
          {sorted.map((appt, idx) => {
            const isLast = idx === sorted.length - 1;
            const st = statusLabel[appt.status] ?? {
              label: appt.status,
              cls: 'bg-gray-100 text-gray-600',
            };
            return (
              <div key={appt.id} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${
                      appt.status === 'completed'
                        ? 'bg-green-500'
                        : appt.status === 'cancelled'
                          ? 'bg-red-400'
                          : 'bg-blue-500'
                    }`}
                  />
                  {!isLast && <div className="w-0.5 flex-1 bg-gray-200 my-1" />}
                </div>

                <div className="pb-4 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-700">{fmt(appt.start_time)}</span>
                    <span className={`text-xs rounded-full px-2 py-0.5 font-medium ${st.cls}`}>{st.label}</span>
                    <span className="text-xs bg-indigo-50 text-indigo-600 rounded-full px-2 py-0.5">
                      {visitLabel(appt.visit_type)}
                    </span>
                    {appt.dentist_name && (
                      <span className="text-xs text-gray-400">{appt.dentist_name}</span>
                    )}
                  </div>
                  {appt.diagnosis && (
                    <p className="mt-1 text-xs text-gray-600">
                      <span className="font-medium text-gray-500">Tashxis:</span> {appt.diagnosis}
                    </p>
                  )}
                  {appt.treatment_notes && (
                    <p className="mt-0.5 text-xs text-gray-500 italic">{appt.treatment_notes}</p>
                  )}
                  {appt.notes && !appt.treatment_notes && (
                    <p className="mt-0.5 text-xs text-gray-500">{appt.notes}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface MedcardSectionProps {
  patientId: number;
}

const MedcardSection = ({ patientId }: MedcardSectionProps) => {
  const { data, isLoading, isError } = usePatientMedcard(patientId);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (isError || !data) {
    return <div className="text-center py-12 text-gray-400">Ma&apos;lumot yuklanmadi</div>;
  }

  const groups = data.appointments.reduce<Record<string, MedcardAppointment[]>>((acc, appt) => {
    const key = appt.service || '__no_service__';
    if (!acc[key]) acc[key] = [];
    acc[key].push(appt);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle size={16} className="text-red-500" />
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Allergiyalar</h3>
          <span className="text-xs bg-red-50 text-red-500 rounded-full px-2 py-0.5">
            {data.allergies.length}
          </span>
        </div>
        {data.allergies.length === 0 ? (
          <p className="text-sm text-gray-400 pl-2">Allergiya qayd etilmagan</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {data.allergies.map((a) => (
              <div
                key={a.id}
                className={`border rounded-xl px-3 py-1.5 text-sm font-medium ${severityColor(a.severity)}`}
                title={a.reaction_type ?? undefined}
              >
                {a.allergen_name}
                {a.severity && (
                  <span className="ml-1 text-xs opacity-70">
                    ({a.severity === 'high' ? 'yuqori' : a.severity === 'medium' ? "o'rta" : 'past'})
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Pill size={16} className="text-blue-500" />
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">Retseptlar</h3>
          <span className="text-xs bg-blue-50 text-blue-500 rounded-full px-2 py-0.5">
            {data.prescriptions.length}
          </span>
        </div>
        {data.prescriptions.length === 0 ? (
          <p className="text-sm text-gray-400 pl-2">Retsept yo&apos;q</p>
        ) : (
          <div className="space-y-2">
            {data.prescriptions.map((p) => (
              <div key={p.id} className="bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-gray-800 text-sm">{p.medication_name}</span>
                  {p.prescribed_at && (
                    <span className="text-xs text-gray-400">{fmt(p.prescribed_at)}</span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-gray-500">
                  {p.dosage && (
                    <span>
                      Doza: <b>{p.dosage}</b>
                    </span>
                  )}
                  {p.frequency && (
                    <span>
                      Chastota: <b>{p.frequency}</b>
                    </span>
                  )}
                  {p.duration && (
                    <span>
                      Muddat: <b>{p.duration}</b>
                    </span>
                  )}
                </div>
                {p.notes && <p className="mt-1 text-xs text-gray-500 italic">{p.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <Clock size={16} className="text-indigo-500" />
          <h3 className="font-bold text-gray-700 text-sm uppercase tracking-wide">
            Davolanish tarixi
          </h3>
          <span className="text-xs bg-indigo-50 text-indigo-500 rounded-full px-2 py-0.5">
            {data.appointments.length} priyom
          </span>
        </div>
        {data.appointments.length === 0 ? (
          <p className="text-sm text-gray-400 pl-2">Priyomlar yo&apos;q</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(groups).map(([service, items]) => (
              <TimelineGroup
                key={service}
                service={service === '__no_service__' ? "Xizmat ko'rsatilmagan" : service}
                items={items}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MedcardSection;
