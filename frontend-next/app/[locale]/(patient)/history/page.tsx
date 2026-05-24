'use client';

import React, { useMemo } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useMyMedcard } from "@/api/medcard";
import ProfileCard from "@/components/PatientHistory/ProfileCard";
import MedicalInfoCard from "@/components/PatientHistory/MedicalInfoCard";
import PrescriptionCard from "@/components/PatientHistory/PrescriptionCard";
import TreatmentsTable from "@/components/PatientHistory/TreatmentsTable";

const toUTC = (iso: string) =>
  iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;

const formatDate = (iso?: string | null) =>
  iso ? new Date(toUTC(iso)).toLocaleDateString("ru-RU") : "Kiritilmagan";

const diffDays = (start: string, end: string) =>
  Math.max(
    0,
    Math.round((new Date(toUTC(end)).getTime() - new Date(toUTC(start)).getTime()) / 86_400_000),
  );

const PatientHistory: React.FC = () => {
  const router = useRouter();
  const { data, isLoading, isError } = useMyMedcard();

  const treatmentGroups = useMemo(() => {
    if (!data) return [];

    const grouped = data.appointments.reduce<Record<string, typeof data.appointments>>((acc, appointment) => {
      const key = appointment.service?.trim() || "Davolash rejasi";
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(appointment);
      return acc;
    }, {});

    return Object.entries(grouped)
      .map(([service, appointments]) => {
        const sorted = [...appointments].sort(
          (a, b) => new Date(toUTC(a.start_time)).getTime() - new Date(toUTC(b.start_time)).getTime(),
        );
        const first = sorted[0];
        const last = sorted[sorted.length - 1];

        return {
          service,
          appointments: sorted,
          appointmentCount: sorted.length,
          periodLabel: `${formatDate(first.start_time)} - ${formatDate(last.start_time)}`,
          durationDays: diffDays(first.start_time, last.start_time),
        };
      })
      .sort((a, b) => {
        const aTime = new Date(toUTC(a.appointments[0].start_time)).getTime();
        const bTime = new Date(toUTC(b.appointments[0].start_time)).getTime();
        return bTime - aTime;
      });
  }, [data]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-white px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-6 p-3 bg-gray-100 rounded-full hover:bg-gray-200 text-[#000814] transition-all active:scale-95"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="rounded-[2rem] border border-red-100 bg-red-50 p-6 text-red-600 font-semibold">
            Medkarta ma'lumotlarini yuklab bo'lmadi.
          </div>
        </div>
      </div>
    );
  }

  const profile = {
    name: data.patient.full_name,
    id: `P-${String(data.patient.id).padStart(6, "0")}`,
    dob: formatDate(data.patient.birth_date),
    gender:
      data.patient.gender === "male"
        ? "Erkak"
        : data.patient.gender === "female"
          ? "Ayol"
          : "Ko'rsatilmagan",
    phone: data.patient.phone || "Kiritilmagan",
    registrationDate: data.appointments[0] ? formatDate(data.appointments[0].start_time) : "Hali priyom yo'q",
  };

  return (
    <div className="min-h-screen bg-white text-[#000814]">
      <div className="p-4 md:p-6 flex items-center gap-4 border-b border-gray-100 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
        <button
          onClick={() => router.back()}
          className="p-3 bg-gray-100 rounded-full hover:bg-gray-200 text-[#000814] transition-all active:scale-95 shrink-0"
        >
          <ArrowLeft size={24} />
        </button>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-blue-300">Medkarta</p>
          <h1 className="text-2xl md:text-4xl font-black leading-tight tracking-tight text-blue-700">
            {data.patient.full_name}
          </h1>
        </div>
      </div>

      <div className="px-4 md:px-6 lg:px-8 max-w-5xl mx-auto space-y-8 mt-6">
        <ProfileCard profile={profile} />
        <MedicalInfoCard allergies={data.allergies} patientAddress={data.patient.address} />
        <PrescriptionCard prescriptions={data.prescriptions} />
        <TreatmentsTable treatments={treatmentGroups} />
      </div>
    </div>
  );
};

export default PatientHistory;
