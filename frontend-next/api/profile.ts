import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "./api"
import { isPatient, isDentist, isAuthenticated, getUserRole, getToken } from "@/utils/auth"

export interface Patient {
    id: number;
    user_id: number;
    full_name: string;
    birth_date?: string | null;
    gender?: string | null;
    address?: string | null;
    phone?: string | null;
    source?: string | null;
    status?: string | null;
    dentist_id?: number | null;
    already_registered?: boolean;
}

export interface DentistProfile {
    id: number;
    user_id: number;
    full_name: string;
    pinfl: string | null;
    diploma_number: string | null;
    verification_status: "pending" | "approved" | "rejected";
    specialization?: string;
    education?: string;
    phone?: string;
    email?: string;
    address?: string;
    clinic?: string;
    birth_date?: string | null;
    schedule?: string;
    work_hours?: string;
    telegram?: string;
    instagram?: string;
    whatsapp?: string;
    latitude?: number | null;
    longitude?: number | null;
    experience_years?: number | null;
    rating?: number | null;
    review_count?: number | null;
    works_photos?: string;
    diploma_photo_url?: string;
    age?: number | null;
    gender?: string | null;
}

export const usePatientProfile = () => {
    const accessToken = getToken()
    const userRole = getUserRole()

    return useQuery({
        queryKey: ['patientProfile'],
        queryFn: async () => {
            const response = await api.get<Patient>('/patients/me');
            return response.data;
        },
        enabled: !!accessToken && isAuthenticated() && isPatient() && userRole === 'patient',
    })
}

export const useDentistProfile = () => {
    const accessToken = getToken()
    const userRole = getUserRole()

    return useQuery({
        queryKey: ['dentistProfile'],
        queryFn: async () => {
            const response = await api.get<DentistProfile>('/dentists/me');
            return response.data;
        },
        enabled: !!accessToken && isAuthenticated() && isDentist() && userRole === 'dentist',
        staleTime: 0,
        refetchOnMount: 'always',
    })
}

export const useAllPatients = () => {
    const accessToken = getToken()
    const userRole = getUserRole()

    return useQuery({
        queryKey: ['patients'],
        queryFn: async (): Promise<Patient[]> => {
            const isLocalMode = accessToken?.startsWith('local_token_');

            if (isLocalMode) {
                const patients = JSON.parse(localStorage.getItem('patients') || '[]');
                return patients;
            }

            const response = await api.get<Patient[]>('/patients/');
            return response.data;
        },
        enabled: !!accessToken && isAuthenticated() && isDentist() && userRole === 'dentist',
    });
}

export const useAllDentists = (params?: {
    search?: string;
    gender?: string;
    region?: string;
    district?: string;
    specialty?: string;
}) => {
    return useQuery({
        queryKey: ['dentists', params],
        queryFn: async () => {
            const response = await api.get<DentistProfile[]>('/dentists/', { params });
            return response.data;
        },
        retry: false,
        staleTime: 5 * 60 * 1000,
    });
}

export const usePatient = (id: number) => {
    return useQuery({
        queryKey: ['patient', id],
        queryFn: async () => {
            const response = await api.get<Patient>(`/patients/${id}`);
            return response.data;
        },
        enabled: !!id
    });
}

export const useCreatePatient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Omit<Patient, 'id' | 'user_id'> & { source?: string }) => {
            const accessToken = getToken() || (typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null);
            const isLocalMode = accessToken?.startsWith('local_token_');

            if (isLocalMode) {
                const raw = JSON.parse(localStorage.getItem('patients') || '[]');
                const userData = JSON.parse(localStorage.getItem('user_data') || '{}');
                const dentistId = userData.dentist_id || 1;

                const newPatient = {
                    ...data,
                    id: Math.max(0, ...raw.map((p: { id: number }) => p.id)) + 1,
                    user_id: 0,
                    dentist_id: dentistId,
                    created_at: new Date().toISOString()
                };
                raw.push(newPatient);
                localStorage.setItem('patients', JSON.stringify(raw));
                return newPatient as Patient;
            }

            const response = await api.post<Patient>('/patients/', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });
};

export interface MagicLink {
    token: string;
    expires_at: string;
    patient_id: number;
    telegram_link?: string;
}

// Doktor bemor uchun magic-havola tokenini oladi (faqat dentist).
// To'liq URL'ni chaqiruvchi komponent quradi (origin + locale).
export const useGetMagicLink = () => {
    return useMutation({
        mutationFn: async (patientId: number): Promise<MagicLink> => {
            const response = await api.get<MagicLink>(`/patients/${patientId}/magic-link`);
            return response.data;
        },
    });
};

export const useUpdatePatient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: number } & Partial<Omit<Patient, 'id' | 'user_id'>>) => {
            const response = await api.patch<Patient>(`/patients/${id}`, data);
            return response.data;
        },
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            queryClient.invalidateQueries({ queryKey: ['patient', variables.id] });
        }
    });
};

export const useDeletePatient = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: number) => {
            const response = await api.delete<{ message: string }>(`/patients/${id}`);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });
};

export const useUpdateDentistProfile = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: Partial<{
            specialization: string;
            education: string;
            phone: string;
            address: string;
            clinic: string;
            birth_date: string | null;
            schedule: string;
            work_hours: string;
            telegram: string;
            instagram: string;
            whatsapp: string;
            latitude: number;
            longitude: number;
            works_photos: string;
            experience_years: number | null;
            age: number | null;
            gender: string | null;
        }>) => {
            const response = await api.put<DentistProfile>('/dentists/me', data);
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dentistProfile'] });
        }
    });
};

export const useUploadDiploma = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (file: File) => {
            const formData = new FormData();
            formData.append('file', file);

            const response = await api.post('/dentists/me/diploma', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['dentistProfile'] });
        }
    });
};

export interface DentistStats {
    total_patients: number;
    total_appointments: number;
    completed_appointments: number;
    pending_appointments: number;
    appointments_today: number;
    appointments_this_month: number;
    new_patients_this_week: number;
    average_rating: number;
    total_reviews: number;
}

export const useDentistStats = () => {
    const accessToken = getToken()
    const userRole = getUserRole()

    return useQuery({
        queryKey: ['dentistStats'],
        queryFn: async () => {
            const response = await api.get<DentistStats>('/dentists/me/stats');
            return response.data;
        },
        enabled: !!accessToken && isAuthenticated() && isDentist() && userRole === 'dentist',
    })
};

export const useSpecializationCounts = () => {
    return useQuery({
        queryKey: ['specializationCounts'],
        queryFn: async () => {
            const response = await api.get<Record<string, number>>('/dentists/specialization-counts');
            return response.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};
