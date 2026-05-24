import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';
import type { Prescription, PrescriptionCreate, PrescriptionUpdate } from '@/types/prescription';

export const getPrescriptions = async (patientId: number): Promise<Prescription[]> => {
  const response = await api.get(`/api/patients/${patientId}/prescriptions`);
  return response.data;
};

export const addPrescription = async (
  patientId: number,
  prescription: PrescriptionCreate
): Promise<Prescription> => {
  const response = await api.post(`/api/patients/${patientId}/prescriptions`, prescription);
  return response.data;
};

export const updatePrescription = async (
  patientId: number,
  prescriptionId: number,
  prescription: PrescriptionUpdate
): Promise<Prescription> => {
  const response = await api.patch(`/api/patients/${patientId}/prescriptions/${prescriptionId}`, prescription);
  return response.data;
};

export const deletePrescriptionApi = async (patientId: number, prescriptionId: number): Promise<void> => {
  await api.delete(`/api/patients/${patientId}/prescriptions/${prescriptionId}`);
};

export const usePrescriptions = (patientId: number) => {
  return useQuery({
    queryKey: ['prescriptions', patientId],
    queryFn: () => getPrescriptions(patientId),
    enabled: !!patientId,
  });
};

export const useAddPrescription = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: PrescriptionCreate) => addPrescription(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medcard', patientId] });
    },
  });
};

export const useUpdatePrescription = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ prescriptionId, data }: { prescriptionId: number; data: PrescriptionUpdate }) =>
      updatePrescription(patientId, prescriptionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medcard', patientId] });
    },
  });
};

export const useDeletePrescription = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (prescriptionId: number) => deletePrescriptionApi(patientId, prescriptionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prescriptions', patientId] });
      queryClient.invalidateQueries({ queryKey: ['medcard', patientId] });
    },
  });
};
