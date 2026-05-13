export interface Prescription {
  id: number;
  patient_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
  prescribed_by: number;
  prescribed_at: string;
}

export interface PrescriptionCreate {
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes?: string;
}

export interface PrescriptionUpdate {
  medication_name?: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}
