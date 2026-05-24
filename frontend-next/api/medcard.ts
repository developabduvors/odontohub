import { useQuery } from "@tanstack/react-query";
import api from "./api";
import { getToken } from "@/utils/auth";

export interface MedcardAllergy {
  id: number;
  allergen_name: string;
  reaction_type: string | null;
  severity: string | null;
  notes: string | null;
  documented_at: string | null;
}

export interface MedcardPrescription {
  id: number;
  medication_name: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  notes: string | null;
  prescribed_at: string | null;
}

export interface MedcardAppointment {
  id: number;
  start_time: string;
  end_time: string;
  service: string | null;
  status: "pending" | "confirmed" | "moved" | "cancelled" | "completed";
  visit_type: string | null;
  notes: string | null;
  diagnosis: string | null;
  treatment_notes: string | null;
  dentist_name: string | null;
}

export interface MedcardPatient {
  id: number;
  full_name: string;
  birth_date: string | null;
  gender: string | null;
  address: string | null;
  phone: string | null;
}

export interface MedcardData {
  patient: MedcardPatient;
  allergies: MedcardAllergy[];
  prescriptions: MedcardPrescription[];
  appointments: MedcardAppointment[];
}

const safeParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const emptyMedcard = (): MedcardData => ({
  patient: {
    id: 1,
    full_name: "Patient",
    birth_date: null,
    gender: null,
    address: null,
    phone: null,
  },
  allergies: [],
  prescriptions: [],
  appointments: [],
});

const buildLocalMedcard = (): MedcardData => {
  if (typeof window === 'undefined') return emptyMedcard();

  const userData = safeParse<Record<string, any>>(localStorage.getItem("user_data"), {});
  const patientProfile = safeParse<Record<string, any>>(localStorage.getItem("patient_profile"), {});
  const rawAppointments = safeParse<any[]>(localStorage.getItem("appointments"), []);

  const appointments: MedcardAppointment[] = rawAppointments.map((item: any) => {
    let startTime = item.start_time || item.created_at || new Date().toISOString();

    if (item.date && item.time) {
      const parts = item.date.split(".");
      if (parts.length === 3) {
        startTime = `${parts[2]}-${parts[1]}-${parts[0]}T${item.time}:00`;
      }
    }

    const endTime =
      item.end_time || new Date(new Date(startTime).getTime() + 60 * 60 * 1000).toISOString();

    return {
      id: item.id,
      start_time: startTime,
      end_time: endTime,
      service: item.service || item.title || null,
      status: (item.status === "upcoming" ? "pending" : item.status === "past" ? "completed" : item.status) || "pending",
      visit_type: item.visit_type || "primary",
      notes: item.notes || item.comment || null,
      diagnosis: item.diagnosis || null,
      treatment_notes: item.treatment_notes || null,
      dentist_name: item.dentist_name || item.doctor_name || "Shifokor",
    };
  });

  const medcard = emptyMedcard();

  return {
    ...medcard,
    patient: {
      id: Number(userData.patient_id || patientProfile.id || 1),
      full_name: patientProfile.name || userData.full_name || "Patient",
      birth_date: patientProfile.birthYear ? `${patientProfile.birthYear}-01-01` : null,
      gender:
        patientProfile.gender === "Мужчина" ? "male" :
        patientProfile.gender === "Женщина" ? "female" :
        userData.gender || null,
      address: patientProfile.address || null,
      phone: userData.phone || null,
    },
    allergies: [],
    prescriptions: [],
    appointments,
  };
};

export const usePatientMedcard = (patientId: number) => {
  return useQuery({
    queryKey: ["medcard", patientId],
    queryFn: async (): Promise<MedcardData> => {
      const res = await api.get<MedcardData>(`/patients/${patientId}/medcard`);
      return res.data;
    },
    enabled: !!patientId,
    staleTime: 30_000,
  });
};

export const useMyMedcard = () => {
  return useQuery({
    queryKey: ["myMedcard"],
    queryFn: async (): Promise<MedcardData> => {
      const accessToken = getToken() || (typeof window !== 'undefined' ? sessionStorage.getItem("access_token") : null);
      const isLocalMode = accessToken?.startsWith("local_token_");

      if (isLocalMode) {
        return buildLocalMedcard();
      }

      try {
        const res = await api.get<MedcardData>("/patients/me/medcard");
        return res.data;
      } catch {
        return buildLocalMedcard();
      }
    },
    staleTime: 30_000,
  });
};
