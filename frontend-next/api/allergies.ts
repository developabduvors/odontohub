import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import type { Allergy, AllergyCreate, AllergyUpdate } from '@/types/allergy';

export const getAllergies = async (patientId: number): Promise<Allergy[]> => {
  const response = await api.get(`/api/patients/${patientId}/allergies`);
  return response.data;
};

export const addAllergy = async (
  patientId: number,
  allergy: AllergyCreate
): Promise<Allergy> => {
  const response = await api.post(`/api/patients/${patientId}/allergies`, allergy);
  return response.data;
};

export const updateAllergy = async (
  patientId: number,
  allergyId: number,
  allergy: AllergyUpdate
): Promise<Allergy> => {
  const response = await api.patch(`/api/patients/${patientId}/allergies/${allergyId}`, allergy);
  return response.data;
};

export const deleteAllergyApi = async (patientId: number, allergyId: number): Promise<void> => {
  await api.delete(`/api/patients/${patientId}/allergies/${allergyId}`);
};

export const useAllergies = (patientId: number) => {
  return useQuery({
    queryKey: ['allergies', patientId],
    queryFn: () => getAllergies(patientId),
    enabled: !!patientId,
  });
};

export const useAddAllergy = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: AllergyCreate) => addAllergy(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medcard', patientId] });
    },
  });
};

export const useUpdateAllergy = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ allergyId, data }: { allergyId: number; data: AllergyUpdate }) =>
      updateAllergy(patientId, allergyId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medcard', patientId] });
    },
  });
};

export const useDeleteAllergy = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (allergyId: number) => deleteAllergyApi(patientId, allergyId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allergies', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medcard', patientId] });
    },
  });
};
