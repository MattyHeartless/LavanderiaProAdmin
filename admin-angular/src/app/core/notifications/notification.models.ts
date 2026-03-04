export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  description: string;
  icon: string;
}
