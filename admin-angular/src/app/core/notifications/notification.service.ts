import { Injectable, signal } from '@angular/core';

import { AppNotification, NotificationType } from './notification.models';

type NotifyPayload = {
  title: string;
  description: string;
  type?: NotificationType;
  icon?: string;
  durationMs?: number;
};

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  readonly notification = signal<AppNotification | null>(null);

  show(payload: NotifyPayload): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }

    const type = payload.type ?? 'info';
    const nextNotification: AppNotification = {
      id: Date.now(),
      type,
      title: payload.title,
      description: payload.description,
      icon: payload.icon ?? this.resolveIcon(type)
    };

    this.notification.set(nextNotification);

    const duration = payload.durationMs ?? 4200;
    this.timeoutId = setTimeout(() => {
      this.dismiss();
    }, duration);
  }

  dismiss(): void {
    this.notification.set(null);
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private resolveIcon(type: NotificationType): string {
    if (type === 'success') {
      return 'check_circle';
    }
    if (type === 'error') {
      return 'error';
    }
    if (type === 'warning') {
      return 'warning';
    }
    return 'info';
  }
}
