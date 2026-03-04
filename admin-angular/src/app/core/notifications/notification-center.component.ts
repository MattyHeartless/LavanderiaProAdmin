import { Component, computed, inject } from '@angular/core';

import { NotificationService } from './notification.service';

@Component({
  selector: 'app-notification-center',
  standalone: true,
  templateUrl: './notification-center.component.html',
  styleUrl: './notification-center.component.scss'
})
export class NotificationCenterComponent {
  private readonly notificationService = inject(NotificationService);

  readonly notification = this.notificationService.notification;
  readonly containerClass = computed(() => {
    const toast = this.notification();
    if (!toast) {
      return '';
    }

    if (toast.type === 'success') {
      return 'toast success';
    }
    if (toast.type === 'error') {
      return 'toast error';
    }
    if (toast.type === 'warning') {
      return 'toast warning';
    }
    return 'toast info';
  });

  dismiss(): void {
    this.notificationService.dismiss();
  }
}
