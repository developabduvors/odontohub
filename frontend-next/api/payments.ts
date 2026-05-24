import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface Payment {
  id: number;
  patient_id: number;
  appointment_id: number | null;
  amount: number;
  paid_amount: number;
  service_name: string;
  payment_date: string;
  status: string;
  notes: string | null;
  recorded_by: number | null;
}

export interface PaymentStats {
  total_amount: number;
  total_paid: number;
  total_debt: number;
}

export const getPatientPayments = async (patientId: number): Promise<Payment[]> => {
  const response = await api.get(`/api/patients/${patientId}/payments`);
  return response.data;
};

export const getPaymentStats = async (patientId: number): Promise<PaymentStats> => {
  const response = await api.get(`/api/patients/${patientId}/payments/stats`);
  return response.data;
};

export const createPayment = async (
  patientId: number,
  data: {
    amount: number;
    paid_amount?: number;
    service_name: string;
    appointment_id?: number;
    status?: string;
    notes?: string;
  }
): Promise<Payment> => {
  const response = await api.post(`/api/patients/${patientId}/payments`, data);
  return response.data;
};

export const updatePayment = async (
  patientId: number,
  paymentId: number,
  data: Partial<Payment>
): Promise<Payment> => {
  const response = await api.patch(`/api/patients/${patientId}/payments/${paymentId}`, data);
  return response.data;
};

export const deletePaymentApi = async (patientId: number, paymentId: number): Promise<void> => {
  await api.delete(`/api/patients/${patientId}/payments/${paymentId}`);
};

export const usePatientPayments = (patientId: number) => {
  return useQuery({
    queryKey: ['payments', patientId],
    queryFn: () => getPatientPayments(patientId),
    enabled: !!patientId,
  });
};

export const usePaymentStats = (patientId: number) => {
  return useQuery({
    queryKey: ['payments', patientId, 'stats'],
    queryFn: () => getPaymentStats(patientId),
    enabled: !!patientId,
  });
};

const invalidatePayments = (queryClient: ReturnType<typeof useQueryClient>, patientId: number) => {
  queryClient.invalidateQueries({ queryKey: ['payments', patientId] });
};

export const useCreatePayment = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createPayment>[1]) => createPayment(patientId, data),
    onSuccess: () => invalidatePayments(queryClient, patientId),
  });
};

export const useUpdatePayment = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentId, data }: { paymentId: number; data: Partial<Payment> }) =>
      updatePayment(patientId, paymentId, data),
    onSuccess: () => invalidatePayments(queryClient, patientId),
  });
};

export const useDeletePayment = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (paymentId: number) => deletePaymentApi(patientId, paymentId),
    onSuccess: () => invalidatePayments(queryClient, patientId),
  });
};
