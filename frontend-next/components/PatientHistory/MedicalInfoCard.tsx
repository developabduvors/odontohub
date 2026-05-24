'use client';

import type { MedcardAllergy } from "@/api/medcard";

interface MedicalInfoCardProps {
  allergies: MedcardAllergy[];
  patientAddress?: string | null;
}

const severityClass = (severity: string | null) => {
  if (severity === "high") return "bg-red-100 text-red-700 border-red-200";
  if (severity === "medium") return "bg-amber-100 text-amber-700 border-amber-200";
  return "bg-emerald-100 text-emerald-700 border-emerald-200";
};

const severityLabel = (severity: string | null) => {
  if (severity === "high") return "Yuqori";
  if (severity === "medium") return "O'rta";
  if (severity === "low") return "Past";
  return "Daraja yo'q";
};

const MedicalInfoCard = ({ allergies, patientAddress }: MedicalInfoCardProps) => {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl md:text-4xl font-black tracking-tight text-blue-900">Muhim tibbiy ma'lumotlar</h2>
      <div className="bg-gray-50 rounded-[2rem] p-6 md:p-10 border border-gray-100 shadow-sm space-y-6">
        <div>
          <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-50 mb-3">Allergiyalar</p>
          {allergies.length === 0 ? (
            <p className="text-lg md:text-xl font-bold text-emerald-600">Allergiya qayd etilmagan</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {allergies.map((allergy) => (
                <div
                  key={allergy.id}
                  className={`rounded-2xl border px-4 py-3 ${severityClass(allergy.severity)}`}
                  title={allergy.reaction_type ?? undefined}
                >
                  <p className="font-black text-base md:text-lg">{allergy.allergen_name}</p>
                  <p className="text-xs font-semibold opacity-80">{severityLabel(allergy.severity)}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-100 pt-4">
          <div className="rounded-3xl bg-white p-5 border border-gray-100">
            <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-50">Kartadagi manzil</p>
            <p className="mt-2 text-lg md:text-xl font-bold text-[#1d1d2b]">{patientAddress || "Kiritilmagan"}</p>
          </div>
          <div className="rounded-3xl bg-white p-5 border border-gray-100">
            <p className="text-[10px] md:text-xs uppercase font-black tracking-widest opacity-50">Risk eslatmasi</p>
            <p className="mt-2 text-lg md:text-xl font-bold text-[#1d1d2b]">
              {allergies.length > 0 ? "Davolashdan oldin allergiyalar tekshirilsin" : "Cheklovlar qayd etilmagan"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MedicalInfoCard;
