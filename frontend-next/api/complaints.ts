import axios from "axios";
import { getToken } from "@/utils/auth";

export interface ComplaintData {
    dentist_id: number;
    reason: string;
}

export const submitComplaint = async (data: ComplaintData) => {
    const accessToken = getToken();
    const isLocalMode = accessToken?.startsWith('local_token_');

    if (isLocalMode) {
        await new Promise(res => setTimeout(res, 500));
        return { message: "Complaint submitted (local mode)", dentist_new_rating: null };
    }

    const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true',
    };

    if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const response = await axios.post(`${baseURL}/complaints/`, data, { headers });
    return response.data;
};
