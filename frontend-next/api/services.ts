import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";
import { isAuthenticated } from '@/utils/auth';

export interface Service {
    id: number;
    name: string;
    price: number;
    currency: string;
}

const FALLBACK_SERVICES: Service[] = [
    { id: 1, name: "Консультация", price: 50000, currency: "UZS" },
    { id: 2, name: "Чистка зубов", price: 150000, currency: "UZS" },
    { id: 3, name: "Лечение кариеса", price: 200000, currency: "UZS" },
    { id: 4, name: "Удаление зуба", price: 120000, currency: "UZS" },
    { id: 5, name: "Установка коронки", price: 800000, currency: "UZS" },
    { id: 6, name: "Отбеливание зубов", price: 350000, currency: "UZS" },
    { id: 7, name: "Имплантация", price: 2500000, currency: "UZS" },
    { id: 8, name: "Брекеты", price: 3000000, currency: "UZS" },
    { id: 9, name: "Рентген", price: 80000, currency: "UZS" },
    { id: 10, name: "Протезирование", price: 1500000, currency: "UZS" },
];

export const useServices = (dentistId?: number) => {
    const useApi = process.env.NEXT_PUBLIC_USE_API !== 'false';
    return useQuery({
        queryKey: ['services', dentistId],
        queryFn: async () => {
            if (!useApi) return FALLBACK_SERVICES;
            try {
                const params = dentistId ? `?dentist_id=${dentistId}` : '';
                const response = await api.get<Service[]>(`/services/${params}`);
                const seen = new Set<string>();
                return response.data.filter(s => {
                    if (seen.has(s.name)) return false;
                    seen.add(s.name);
                    return true;
                });
            } catch {
                return FALLBACK_SERVICES;
            }
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
