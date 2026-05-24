import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from './api';

export interface PatientPhoto {
  id: number;
  patient_id: number;
  title: string;
  file_url: string;
  category: string;
  description: string | null;
  uploaded_at: string;
  uploaded_by: number | null;
}

export const getPatientPhotos = async (
  patientId: number,
  category?: string
): Promise<PatientPhoto[]> => {
  const params = category ? { category } : {};
  const response = await api.get(`/api/patients/${patientId}/photos`, { params });
  return response.data;
};

export const createPhoto = async (
  patientId: number,
  data: {
    title: string;
    file_url: string;
    category: string;
    description?: string;
  }
): Promise<PatientPhoto> => {
  const response = await api.post(`/api/patients/${patientId}/photos`, data);
  return response.data;
};

export const updatePhoto = async (
  patientId: number,
  photoId: number,
  data: Partial<PatientPhoto>
): Promise<PatientPhoto> => {
  const response = await api.patch(`/api/patients/${patientId}/photos/${photoId}`, data);
  return response.data;
};

export const deletePhotoApi = async (patientId: number, photoId: number): Promise<void> => {
  await api.delete(`/api/patients/${patientId}/photos/${photoId}`);
};

export const usePatientPhotos = (patientId: number, category?: string) => {
  return useQuery({
    queryKey: ['photos', patientId, category ?? 'all'],
    queryFn: () => getPatientPhotos(patientId, category),
    enabled: !!patientId,
  });
};

const invalidatePhotos = (queryClient: ReturnType<typeof useQueryClient>, patientId: number) => {
  queryClient.invalidateQueries({ queryKey: ['photos', patientId] });
};

export const useCreatePhoto = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof createPhoto>[1]) => createPhoto(patientId, data),
    onSuccess: () => invalidatePhotos(queryClient, patientId),
  });
};

export const useUpdatePhoto = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ photoId, data }: { photoId: number; data: Partial<PatientPhoto> }) =>
      updatePhoto(patientId, photoId, data),
    onSuccess: () => invalidatePhotos(queryClient, patientId),
  });
};

export const useDeletePhoto = (patientId: number) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: number) => deletePhotoApi(patientId, photoId),
    onSuccess: () => invalidatePhotos(queryClient, patientId),
  });
};
