import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { NotificationService } from '../../core/notifications/notification.service';
import { DeliveryMode } from '../../core/orders/orders.models';
import { OrdersService } from '../../core/orders/orders.service';

@Component({
  selector: 'app-delivery-modes-page',
  standalone: true,
  templateUrl: './delivery-modes-page.component.html',
  styleUrl: './delivery-modes-page.component.scss'
})
export class DeliveryModesPageComponent {
  private readonly ordersService = inject(OrdersService);
  private readonly notificationService = inject(NotificationService);

  readonly deliveryModes = signal<DeliveryMode[]>([]);
  readonly loading = signal(false);

  constructor() {
    this.loadDeliveryModes();
  }

  trackById(_index: number, item: DeliveryMode): number {
    return item.id;
  }

  activeCount(): number {
    return this.deliveryModes().filter((item) => item.isActive).length;
  }

  maxSurcharge(): number {
    return this.deliveryModes().reduce((max, item) => Math.max(max, item.surchargeAmount), 0);
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  private loadDeliveryModes(): void {
    this.loading.set(true);
    this.ordersService
      .listDeliveryModes()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (deliveryModes) => {
          const sortedModes = [...deliveryModes].sort((left, right) => left.sortOrder - right.sortOrder);
          this.deliveryModes.set(sortedModes);
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar modos de entrega',
            description: error.message || 'Valida la conexion con el microservicio de pedidos.'
          });
        }
      });
  }
}
