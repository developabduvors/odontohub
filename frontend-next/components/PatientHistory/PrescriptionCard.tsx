'use client';

import { useTranslations } from "next-intl";
import type { MedcardPrescription } from "@/api/medcard";

interface PrescriptionCardProps {
  prescriptions: MedcardPrescription[];
}

const formatDate = (iso?: string | null) => {
  if (!iso) return null;
  const utcValue = iso.endsWith("Z") || iso.includes("+") ? iso : `${iso}Z`;
  return new Date(utcValue).toLocaleDateString("ru-RU");
};

const PrescriptionCard = ({ prescriptions }: PrescriptionCardProps) => {
  const t = useTranslations("patient.medcard.prescriptions");
  return (
    <div className="space-y-6">
      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-blue-900">{t("title")}</h2>
      <div className="bg-blue-50 rounded-[2rem] p-6 md:p-8 space-y-4 border border-blue-100 shadow-sm">
        {prescriptions.length === 0 ? (
          <p className="text-lg md:text-xl font-bold text-blue-800/70">{t("empty")}</p>
        ) : (
          prescriptions.map((prescription) => (
            <div key={prescription.id} className="rounded-[1.5rem] bg-white px-5 py-4 border border-blue-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <p className="text-xl md:text-2xl font-black text-blue-800">{prescription.medication_name}</p>
                {formatDate(prescription.prescribed_at) && (
                  <span className="text-sm font-bold text-blue-500">{formatDate(prescription.prescribed_at)}</span>
                )}
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm md:text-base text-blue-900">
                {prescription.dosage && <span><b>{t("dosage")}:</b> {prescription.dosage}</span>}
                {prescription.frequency && <span><b>{t("frequency")}:</b> {prescription.frequency}</span>}
                {prescription.duration && <span><b>{t("duration")}:</b> {prescription.duration}</span>}
              </div>
              {prescription.notes && (
                <p className="mt-3 text-sm md:text-base text-blue-900/70">{prescription.notes}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PrescriptionCard;
