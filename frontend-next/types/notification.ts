export type NotificationType =
  | 'appointment_reminder'
  | 'appointment_rescheduled'
  | 'appointment_cancelled'
  | 'analytics_check'
  | 'rating_decreased'
  | 'rating_increased'
  | 'appointment_rated'
  | 'review_left'
  | 'payment_reminder';

export interface NotificationMetadata {
  patient_name?: string;
  new_date?: string;
  reason?: string;
  rating?: number;
  review?: string;
  stars?: number;
  [key: string]: any;
}

export interface Notification {
  id: number;
  user_id: number;
  notification_type: NotificationType;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  is_read: boolean;
  created_at: string;
}

export interface UnreadCount {
  count: number;
}
