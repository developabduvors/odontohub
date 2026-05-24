import { useQuery } from "@tanstack/react-query";
import api from "./api";
import { getToken } from "@/utils/auth";

export interface Review {
    id: number;
    rating: number;
    comment: string | null;
    created_at: string;
    patient_name: string;
}

export interface DentistReviewsResponse {
    average: number;
    count: number;
    reviews: Review[];
}

export const useDentistReviews = (dentistId?: number) => {
    return useQuery({
        queryKey: ['dentistReviews', dentistId],
        queryFn: async (): Promise<DentistReviewsResponse> => {
            const accessToken = getToken() || (typeof window !== 'undefined' ? sessionStorage.getItem('access_token') : null);
            const isLocalMode = accessToken?.startsWith('local_token_');

            if (isLocalMode) {
                return {
                    average: 4.2,
                    count: 4,
                    reviews: [
                        { id: 1, rating: 5, comment: "Zo'r doktor, qo'llari yengil ekan. Katta rahmat!", created_at: new Date().toISOString(), patient_name: "Aziz" },
                        { id: 2, rating: 4, comment: "Xizmat yaxshi, faqat ozgina kutishga to'g'ri keldi.", created_at: new Date(Date.now() - 86400000).toISOString(), patient_name: "Sherzod" },
                        { id: 3, rating: 5, comment: "Tishim umuman og'rimadi. Rahmat!", created_at: new Date(Date.now() - 172800000).toISOString(), patient_name: "Malika" },
                        { id: 4, rating: 3, comment: "Yaxshi", created_at: new Date(Date.now() - 259200000).toISOString(), patient_name: "Jasur" }
                    ]
                };
            }

            const response = await api.get<DentistReviewsResponse>(`/reviews/dentist/${dentistId}`);
            return response.data;
        },
        enabled: !!dentistId
    });
};
