import { Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { AuthUser } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { OrderRecord } from '../../core/orders/orders.models';
import { OrdersService } from '../../core/orders/orders.service';

type OrderStatusMeta = {
  label: string;
  toneClass: string;
};

type OrderListItem = {
  id: string;
  orderCode: string;
  customerName: string;
  customerInitials: string;
  serviceSummary: string;
  deliveryModeLabel: string;
  pickupDateLabel: string;
  pickupTimeLabel: string;
  statusLabel: string;
  statusClass: string;
};

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent {
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly orders = signal<OrderListItem[]>([]);
  readonly loading = signal(false);

  private readonly dateFormatter = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  private readonly timeFormatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });

  constructor() {
    this.loadOrders();
  }

  trackByOrderId(_index: number, order: OrderListItem): string {
    return order.id;
  }

  viewOrder(orderId: string): void {
    void this.router.navigate(['/admin/orders', orderId]);
  }

  private loadOrders(): void {
    this.loading.set(true);

    forkJoin({
      orders: this.ordersService.listOrders(),
      users: this.authService.listUsers()
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: ({ orders, users }) => {
          const usersById = new Map<string, AuthUser>(users.map((user) => [user.id, user]));
          const mappedOrders = orders.map((order) => this.mapOrderToListItem(order, usersById));
          this.orders.set(mappedOrders);
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar pedidos',
            description: error.message || 'Valida la conexion con el servicio de pedidos.'
          });
        }
      });
  }

  private mapOrderToListItem(orderRecord: OrderRecord, usersById: Map<string, AuthUser>): OrderListItem {
    const customer = usersById.get(orderRecord.order.userId);
    const customerName = customer?.fullName ?? 'Cliente no encontrado';
    const statusMeta = this.resolveStatus(orderRecord.order.status);

    return {
      id: orderRecord.order.id,
      orderCode: this.resolveOrderCode(orderRecord.order.id),
      customerName,
      customerInitials: this.resolveInitials(customerName),
      serviceSummary: this.resolveServiceSummary(orderRecord),
      deliveryModeLabel: this.resolveDeliveryModeLabel(orderRecord),
      pickupDateLabel: this.resolveDateLabel(orderRecord.order.pickupDate),
      pickupTimeLabel: this.resolveTimeLabel(orderRecord.order.pickupTime),
      statusLabel: statusMeta.label,
      statusClass: statusMeta.toneClass
    };
  }

  private resolveServiceSummary(orderRecord: OrderRecord): string {
    if (!Array.isArray(orderRecord.orderDetails) || orderRecord.orderDetails.length === 0) {
      return 'Sin detalle';
    }

    return orderRecord.orderDetails.map((detail) => detail.serviceName).join(', ');
  }

  private resolveDeliveryModeLabel(orderRecord: OrderRecord): string {
    const { deliveryModeName, deliveryEtaHours } = orderRecord.order;
    if (!deliveryModeName) {
      return 'Sin modo registrado';
    }

    if (!deliveryEtaHours) {
      return deliveryModeName;
    }

    return `${deliveryModeName} · ${deliveryEtaHours}h`;
  }

  private resolveDateLabel(pickupDate: string): string {
    const parsedDate = new Date(`${pickupDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
      return pickupDate;
    }

    return this.dateFormatter.format(parsedDate);
  }

  private resolveTimeLabel(pickupTime: string): string {
    const [hoursText, minutesText] = pickupTime.split(':');
    const hours = Number(hoursText);
    const minutes = Number(minutesText);

    if (!Number.isInteger(hours) || !Number.isInteger(minutes)) {
      return pickupTime;
    }

    const timeDate = new Date();
    timeDate.setHours(hours, minutes, 0, 0);
    return this.timeFormatter.format(timeDate);
  }

  private resolveInitials(name: string): string {
    const words = name
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0)
      .slice(0, 2);

    if (words.length === 0) {
      return 'NA';
    }

    return words.map((word) => word[0]?.toUpperCase() ?? '').join('');
  }

  private resolveStatus(status: number): OrderStatusMeta {
    if (status === 1) {
      return { label: 'Creada', toneClass: 'bg-slate-100 text-slate-700' };
    }
    if (status === 2) {
      return { label: 'Pagada', toneClass: 'bg-cyan-100 text-cyan-700' };
    }
    if (status === 3) {
      return { label: 'En recoleccion', toneClass: 'bg-blue-100 text-blue-700' };
    }
    if (status === 4) {
      return { label: 'En proceso', toneClass: 'bg-indigo-100 text-indigo-700' };
    }
    if (status === 5) {
      return { label: 'En entrega', toneClass: 'bg-violet-100 text-violet-700' };
    }
    if (status === 6) {
      return { label: 'Completada', toneClass: 'bg-emerald-100 text-emerald-700' };
    }
    if (status === 7) {
      return { label: 'Cancelado', toneClass: 'bg-rose-100 text-rose-700' };
    }

    return { label: `Estado ${status}`, toneClass: 'bg-slate-100 text-slate-700' };
  }

  private resolveOrderCode(orderId: string): string {
    if (!orderId) {
      return '';
    }

    return orderId.split('-')[0] ?? orderId;
  }
}
