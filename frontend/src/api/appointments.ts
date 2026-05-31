import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import api from "./api"

export interface Appointment {
    id: number;
    dentist_id: number;
    patient_id: number;
    start_time: string;
    end_time: string;
    status: "pending" | "confirmed" | "in_progress" | "moved" | "cancelled" | "completed";
    service?: string | null;
    price?: number | null;
    notes?: string | null;
    cancel_reason?: string | null;
    dentist_name?: string;
    patient_name?: string;
    visit_type?: "primary" | "follow_up";
}

export interface AppointmentCreate {
    dentist_id: number;
    patient_id?: number;
    start_time: string;
    end_time: string;
    service?: string;
    price?: number;
    notes?: string;
    visit_type?: "primary" | "follow_up";
}

export const useCreateAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (data: AppointmentCreate) => {
            const accessToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
            const isLocalMode = accessToken?.startsWith('local_token_');

            if (isLocalMode) {
                const raw = JSON.parse(localStorage.getItem('appointments') || '[]');
                const patients = JSON.parse(localStorage.getItem('patients') || '[]');
                const patient = patients.find((p: any) => p.id === data.patient_id);
                const start = new Date(data.start_time);

                const newApt = {
                    ...data,
                    id: Math.max(0, ...raw.map((a: any) => a.id)) + 1,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    patient_name: patient ? patient.full_name : 'РџР°С†РёРµРЅС‚',
                    doctor_name: 'Р”РѕРєС‚РѕСЂ',
                    date: start.toLocaleDateString('ru-RU'),
                    time: start.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
                };
                raw.push(newApt);
                localStorage.setItem('appointments', JSON.stringify(raw));

                return {
                    id: newApt.id,
                    dentist_id: newApt.dentist_id,
                    patient_id: newApt.patient_id || 1,
                    start_time: newApt.start_time,
                    end_time: newApt.end_time,
                    status: 'pending',
                    service: newApt.service,
                    price: newApt.price,
                    notes: newApt.notes,
                    patient_name: newApt.patient_name,
                    dentist_name: newApt.doctor_name
                } as Appointment;
            }

            const response = await api.post<Appointment>('/appointments/', data);
            return response.data;
        },
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            if (variables.patient_id) {
                queryClient.invalidateQueries({ queryKey: ['patientAppointments', variables.patient_id] });
            }
        }
    });
};

export const useMyAppointments = () => {
    const useApi = import.meta.env.VITE_USE_API !== 'false';

    return useQuery({
        queryKey: ['myAppointments'],
        queryFn: async (): Promise<Appointment[]> => {
            const accessToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
            const isLocalMode = accessToken?.startsWith('local_token_');

            if (isLocalMode || !useApi) {
                const raw = JSON.parse(localStorage.getItem('appointments') || '[]');
                const userData = JSON.parse(sessionStorage.getItem('user_data') || localStorage.getItem('user_data') || '{}');

                return raw.map((a: any) => {
                    let start_time = a.start_time || a.created_at || new Date().toISOString();
                    if (a.date && a.time) {
                        const parts = a.date.split('.');
                        if (parts.length === 3) {
                            start_time = `${parts[2]}-${parts[1]}-${parts[0]}T${a.time}:00`;
                        }
                    }
                    const end_time = a.end_time || new Date(new Date(start_time).getTime() + 60 * 60 * 1000).toISOString();
                    return {
                        id: a.id,
                        dentist_id: a.doctor_id || a.dentist_id || 2,
                        patient_id: a.patient_id || 1,
                        start_time,
                        end_time,
                        status: (a.status === 'upcoming' ? 'pending' : a.status === 'past' ? 'completed' : a.status) as Appointment['status'],
                        service: a.service || null,
                        price: a.price || null,
                        notes: a.notes || a.comment || null,
                        dentist_name: a.doctor_name || a.dentist_name || 'Р”РѕРєС‚РѕСЂ',
                        patient_name: a.patient_name || userData.full_name || 'РџР°С†РёРµРЅС‚',
                    };
                });
            }

            try {
                const response = await api.get<Appointment[]>('/appointments/me');
                return response.data;
            } catch (err: any) {
                if (err.response?.status === 401) return [];
                throw err;
            }
        },
        enabled: !!(sessionStorage.getItem('access_token') || localStorage.getItem('access_token')),
        staleTime: 0,
        refetchOnMount: 'always',
        refetchOnWindowFocus: true,
    });
};

export const useUpdateAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, ...data }: { id: number } & Partial<Appointment>) => {
            const accessToken = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
            const isLocalMode = accessToken?.startsWith('local_token_');

            if (isLocalMode) {
                const raw = JSON.parse(localStorage.getItem('appointments') || '[]');
                const updated = raw.map((a: any) => {
                    if (a.id === id) {
                        return { ...a, ...data };
                    }
                    return a;
                });
                localStorage.setItem('appointments', JSON.stringify(updated));
                return { id, ...data } as Appointment;
            }

            const response = await api.patch<Appointment>(`/appointments/${id}`, data);
            return response.data;
        },
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
            if (data?.patient_id) {
                queryClient.invalidateQueries({ queryKey: ['patientAppointments', data.patient_id] });
            }
        }
    });
};

export const useCancelAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, reason }: { id: number; reason?: string }) => {
            const response = await api.patch<Appointment>(`/appointments/${id}`, {
                status: 'cancelled',
                cancel_reason: reason
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });
};

export const useRescheduleAppointment = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, start_time, end_time }: { id: number; start_time: string; end_time: string }) => {
            const response = await api.patch<Appointment>(`/appointments/${id}`, {
                start_time,
                end_time,
                status: 'moved'
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['appointments'] });
            queryClient.invalidateQueries({ queryKey: ['myAppointments'] });
            queryClient.invalidateQueries({ queryKey: ['patients'] });
        }
    });
};

export const getPatientAppointments = async (patientId: number): Promise<Appointment[]> => {
    const response = await api.get<Appointment[]>(`/appointments/patient/${patientId}`);
    return response.data;
};

export const usePatientAppointments = (patientId: number) => {
    return useQuery({
        queryKey: ['patientAppointments', patientId],
        queryFn: () => getPatientAppointments(patientId),
        enabled: !!patientId,
        staleTime: 0,
        refetchOnMount: 'always',
    });
};

export const useAppointment = (id: number) => {
    return useQuery({
        queryKey: ['appointment', id],
        queryFn: async () => {
            const response = await api.get<Appointment>(`/appointments/${id}`);
            return response.data;
        },
        enabled: !!id,
    });
};
