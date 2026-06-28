import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";
import { isAuthenticated } from '@/utils/auth';

export interface Service {
    id: number;
    name: string;
    price: number;
    currency: string;
}

export const useServices = (dentistId?: number) => {
    return useQuery({
        queryKey: ['services', dentistId],
        queryFn: async () => {
            // Faqat doktorning o'zi qo'shgan xizmatlari — mock fallback yo'q
            const params = dentistId ? `?dentist_id=${dentistId}` : '';
            const response = await api.get<Service[]>(`/services/${params}`);
            const seen = new Set<string>();
            return response.data.filter(s => {
                if (seen.has(s.name)) return false;
                seen.add(s.name);
                return true;
            });
        },
        enabled: isAuthenticated(),
    });
};

// Doktorning O'ZINING xizmatlari — JWT orqali, dentist_id klientdan kelmaydi.
// Boshqaruv (DoctorProfile) ko'rinishi shuni ishlatadi: hech qachon boshqa
// doktorning xizmatlari aralashmaydi.
export const useMyServices = () => {
    return useQuery({
        queryKey: ['services', 'my'],
        queryFn: async () => {
            const response = await api.get<Service[]>('/services/my');
            return response.data;
        },
        enabled: isAuthenticated(),
    });
};

export const useCreateService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: { name: string; price: number }) => {
            const response = await api.post<Service>('/services/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        },
        mutationKey: ['createService'],
    });
};

export const useUpdateService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, data }: { id: number; data: { name: string; price: number } }) => {
            const response = await api.patch<Service>(`/services/${id}`, data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        }
    });
};

export const useDeleteService = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete<Service>(`/services/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
        }
    });
};
