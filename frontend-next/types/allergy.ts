export type AllergySeverity = 'mild' | 'moderate' | 'severe';

export interface Allergy {
  id: number;
  patient_id: number;
  allergen_name: string;
  reaction_type: string;
  severity: AllergySeverity;
  notes?: string;
  documented_by: number;
  documented_at: string;
}

export interface AllergyCreate {
  allergen_name: string;
  reaction_type: string;
  severity: AllergySeverity;
  notes?: string;
}

export interface AllergyUpdate {
  allergen_name?: string;
  reaction_type?: string;
  severity?: AllergySeverity;
  notes?: string;
}
