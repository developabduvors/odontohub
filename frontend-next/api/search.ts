import { useQuery } from "@tanstack/react-query";
import api from "./api";
import type { Doctor } from "@/types/patient";

export interface Service {
    id: number;
    name: string;
    price: number;
    dentist_id: number;
    dentist_name?: string;
    category?: string;
}

export const useSearchDoctors = (query: string) => {
    return useQuery<Doctor[]>({
        queryKey: ['search-doctors', query],
        queryFn: async () => {
            const { data } = await api.get(`/dentists/`, {
                params: { search: query }
            });
            return data;
        },
        enabled: query.length > 0,
    });
};

export const useSearchServices = (query: string) => {
    return useQuery<Service[]>({
        queryKey: ['search-services', query],
        queryFn: async () => {
            const { data } = await api.get(`/services/`, {
                params: { search: query }
            });
            return data;
        },
        enabled: query.length > 0,
    });
};
