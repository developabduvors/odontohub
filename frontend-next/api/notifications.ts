import { useQuery } from '@tanstack/react-query';
import api from './api';

export interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export const useNotifications = () => {
    return useQuery({
        queryKey: ['notifications'],
        queryFn: async (): Promise<Notification[]> => {
            const response = await api.get('/api/notifications/');
            return response.data;
        }
    });
};

export const useUnreadCount = () => {
    return useQuery({
        queryKey: ['notifications', 'unread-count'],
        queryFn: async (): Promise<number> => {
            try {
                const response = await api.get('/api/notifications/unread-count');
                return response.data.unread_count || 0;
            } catch {
                return 0;
            }
        },
        refetchInterval: 30000,
    });
};

export const markAsRead = async (id: number): Promise<void> => {
  await api.patch(`/api/notifications/${id}/read`);
};

export const markAllAsRead = async (): Promise<void> => {
  await api.patch('/api/notifications/mark-all-read');
};

export const deleteAllNotifications = async (): Promise<void> => {
  await api.delete('/api/notifications/delete-all');
};

export const getUnreadCount = async (): Promise<number> => {
    try {
        const response = await api.get('/api/notifications/unread-count');
        return response.data.unread_count || 0;
    } catch {
        return 0;
    }
};

export const getNotifications = async (): Promise<Notification[]> => {
  const response = await api.get('/api/notifications/');
  return response.data;
};
