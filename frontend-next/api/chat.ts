import api from './api';

export interface ChatMessage {
    id: number;
    appointment_id: number;
    sender_id: number;
    text: string;
    image_data?: string | null;
    created_at: string;
}

export const sendMessage = async (appointment_id: number, text: string, image_data?: string): Promise<ChatMessage> => {
    const response = await api.post<ChatMessage>('/api/chat/send', { appointment_id, text: text || '', image_data: image_data || null });
    return response.data;
};

export const getMessages = async (appointment_id: number): Promise<ChatMessage[]> => {
    const response = await api.get<ChatMessage[]>(`/api/chat/${appointment_id}`);
    return response.data;
};

export const deleteMessage = async (message_id: number): Promise<void> => {
    await api.delete(`/api/chat/${message_id}`);
};

export const editMessage = async (message_id: number, text: string): Promise<ChatMessage> => {
    const response = await api.patch<ChatMessage>(`/api/chat/${message_id}`, { text });
    return response.data;
};
