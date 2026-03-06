import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, forkJoin } from 'rxjs';

import { AuthUser } from '../../core/auth/auth.models';
import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { OrderDetail, OrderRecord } from '../../core/orders/orders.models';
import { OrdersService } from '../../core/orders/orders.service';

type StatusMeta = {
  label: string;
  badgeClass: string;
  progressStep: number;
};

type ProgressStep = {
  key: number;
  label: string;
  icon: string;
  circleClass: string;
  labelClass: string;
};

type TimelineItem = {
  id: string;
  label: string;
  dateLabel: string;
  timeLabel: string;
  current: boolean;
};

@Component({
  selector: 'app-order-detail-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './order-detail-page.component.html',
  styleUrl: './order-detail-page.component.scss'
})
export class OrderDetailPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly ordersService = inject(OrdersService);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly loading = signal(false);
  readonly orderRecord = signal<OrderRecord | null>(null);
  readonly customer = signal<AuthUser | null>(null);

  private readonly orderId = this.route.snapshot.paramMap.get('id') ?? '';
  private readonly stepConfig = [
    { key: 1, label: 'Creada', icon: 'add' },
    { key: 2, label: 'Pagada', icon: 'payments' },
    { key: 3, label: 'Recoleccion', icon: 'local_shipping' },
    { key: 4, label: 'Procesando', icon: 'dry_cleaning' },
    { key: 5, label: 'Entrega', icon: 'delivery_dining' },
    { key: 6, label: 'Finalizada', icon: 'task_alt' }
  ];

  private readonly dateFormatterLong = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  private readonly dateFormatterShort = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });

  private readonly timeFormatter = new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit',
    minute: '2-digit'
  });

  readonly statusMeta = computed(() => this.resolveStatus(this.orderRecord()?.order.status ?? 0));

  readonly orderCode = computed(() => {
    const id = this.orderRecord()?.order.id ?? '';
    return id.split('-')[0] ?? id;
  });

  readonly progressPercent = computed(() => {
    const currentStep = this.statusMeta().progressStep;
    if (currentStep <= 0) {
      return 0;
    }
    if (currentStep >= this.stepConfig.length) {
      return 100;
    }

    return ((currentStep - 1) / (this.stepConfig.length - 1)) * 100;
  });

  readonly progressSteps = computed<ProgressStep[]>(() => {
    const currentStep = this.statusMeta().progressStep;

    return this.stepConfig.map((step) => {
      const isCompleted = currentStep > 0 && step.key < currentStep;
      const isCurrent = currentStep > 0 && step.key === currentStep;
      const isPending = !isCompleted && !isCurrent;

      if (isCompleted) {
        return {
          ...step,
          circleClass:
            'size-8 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white z-10',
          labelClass: 'mt-2 text-[10px] font-bold uppercase text-slate-900'
        };
      }

      if (isCurrent) {
        return {
          ...step,
          circleClass:
            'size-8 rounded-full bg-primary text-white flex items-center justify-center ring-4 ring-white z-10 animate-pulse',
          labelClass: 'mt-2 text-[10px] font-bold uppercase text-primary'
        };
      }

      if (isPending) {
        return {
          ...step,
          circleClass:
            'size-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center ring-4 ring-white z-10',
          labelClass: 'mt-2 text-[10px] font-bold uppercase text-slate-400'
        };
      }

      return {
        ...step,
        circleClass:
          'size-8 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center ring-4 ring-white z-10',
        labelClass: 'mt-2 text-[10px] font-bold uppercase text-slate-400'
      };
    });
  });

  readonly servicesSubtotal = computed(() => {
    const record = this.orderRecord();
    if (!record) {
      return 0;
    }
    return record.orderDetails.reduce((total, detail) => total + detail.subTotal, 0);
  });

  readonly isCancelled = computed(() => this.orderRecord()?.order.status === 7);

  readonly timelineItems = computed<TimelineItem[]>(() => {
    const record = this.orderRecord();
    if (!record) {
      return [];
    }

    const createdAt = record.order.createdAt;
    const pickupDateTime = this.parsePickupDateTime(record.order.pickupDate, record.order.pickupTime);
    const recollectedAt = record.order.recollectedAt;
    const deliveredAt = record.order.deliveredAt;
    const status = record.order.status;

    const items: TimelineItem[] = [
      {
        id: 'created',
        label: 'Pedido creado',
        dateLabel: this.formatDate(createdAt, 'short'),
        timeLabel: this.formatTime(createdAt),
        current: status === 1
      }
    ];

    if (status >= 2) {
      items.push({
        id: 'paid',
        label: 'Pago confirmado',
        dateLabel: this.formatDate(createdAt, 'short'),
        timeLabel: this.formatTime(createdAt),
        current: status === 2
      });
    }

    if (status >= 3 || recollectedAt) {
      const reference = recollectedAt ?? pickupDateTime;
      items.push({
        id: 'recollecting',
        label: 'Recoleccion',
        dateLabel: this.formatDate(reference, 'short'),
        timeLabel: this.formatTime(reference),
        current: status === 3
      });
    }

    if (status >= 4) {
      const reference = recollectedAt ?? pickupDateTime ?? createdAt;
      items.push({
        id: 'processing',
        label: 'En procesamiento',
        dateLabel: this.formatDate(reference, 'short'),
        timeLabel: this.formatTime(reference),
        current: status === 4
      });
    }

    if (status >= 5) {
      const reference = deliveredAt ?? recollectedAt ?? pickupDateTime ?? createdAt;
      items.push({
        id: 'delivering',
        label: 'En entrega',
        dateLabel: this.formatDate(reference, 'short'),
        timeLabel: this.formatTime(reference),
        current: status === 5
      });
    }

    if (status >= 6 && deliveredAt) {
      items.push({
        id: 'completed',
        label: 'Pedido completado',
        dateLabel: this.formatDate(deliveredAt, 'short'),
        timeLabel: this.formatTime(deliveredAt),
        current: status === 6
      });
    }

    if (status === 7) {
      items.push({
        id: 'cancelled',
        label: 'Pedido cancelado',
        dateLabel: this.formatDate(createdAt, 'short'),
        timeLabel: this.formatTime(createdAt),
        current: true
      });
    }

    return items;
  });

  constructor() {
    this.loadOrder();
  }

  trackByDetailId(_index: number, detail: OrderDetail): string {
    return detail.id;
  }

  trackByTimelineId(_index: number, item: TimelineItem): string {
    return item.id;
  }

  backToOrders(): void {
    void this.router.navigate(['/admin/orders']);
  }

  customerName(): string {
    return this.customer()?.fullName ?? 'Cliente no encontrado';
  }

  customerEmail(): string {
    return this.customer()?.email ?? 'Sin correo';
  }

  customerPhone(): string {
    return this.customer()?.phoneNumber ?? 'Sin telefono';
  }

  shippingLineOne(): string {
    const record = this.orderRecord();
    if (!record) {
      return '';
    }
    const address = record.order.shippingAddress;
    return `${address.street}`;
  }

  shippingLineTwo(): string {
    const record = this.orderRecord();
    if (!record) {
      return '';
    }

    const address = record.order.shippingAddress;
    return `${address.neighbourhood}, ${address.city}, ${address.state}, ${address.zipCode}`;
  }

  pickupScheduleLabel(): string {
    const record = this.orderRecord();
    if (!record) {
      return '';
    }
    const pickupDateTime = this.parsePickupDateTime(record.order.pickupDate, record.order.pickupTime);
    return `${this.formatDate(pickupDateTime, 'short')} - ${this.formatTime(pickupDateTime)}`;
  }

  paymentMethodLabel(): string {
    const record = this.orderRecord();
    if (!record) {
      return 'Sin informacion';
    }

    if (record.order.isPostPayment) {
      if (record.order.postPaymentMethod.trim().length > 0) {
        return `Postpago (${record.order.postPaymentMethod})`;
      }
      return 'Postpago';
    }

    return 'Prepago online';
  }

  paymentStatusLabel(): string {
    const status = this.orderRecord()?.order.status ?? 0;
    if (status >= 2 && status !== 7) {
      return 'APROBADO';
    }
    if (status === 7) {
      return 'CANCELADO';
    }
    return 'PENDIENTE';
  }

  paymentStatusClass(): string {
    const status = this.orderRecord()?.order.status ?? 0;
    if (status >= 2 && status !== 7) {
      return 'bg-emerald-100 text-emerald-700';
    }
    if (status === 7) {
      return 'bg-rose-100 text-rose-700';
    }
    return 'bg-amber-100 text-amber-700';
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  formatDate(value: string | Date | null, format: 'long' | 'short' = 'short'): string {
    const parsed = this.toDate(value);
    if (!parsed) {
      return 'Sin fecha';
    }
    return format === 'long' ? this.dateFormatterLong.format(parsed) : this.dateFormatterShort.format(parsed);
  }

  formatTime(value: string | Date | null): string {
    const parsed = this.toDate(value);
    if (!parsed) {
      return 'Sin hora';
    }
    return this.timeFormatter.format(parsed);
  }

  private loadOrder(): void {
    if (!this.orderId) {
      this.notificationService.show({
        type: 'error',
        title: 'Pedido invalido',
        description: 'No se recibio el identificador del pedido.'
      });
      return;
    }

    this.loading.set(true);
    forkJoin({
      order: this.ordersService.getOrderById(this.orderId),
      users: this.authService.listUsers()
    })
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: ({ order, users }) => {
          if (!order) {
            this.orderRecord.set(null);
            this.customer.set(null);
            this.notificationService.show({
              type: 'warning',
              title: 'Pedido no encontrado',
              description: 'No fue posible localizar el pedido solicitado.'
            });
            return;
          }

          this.orderRecord.set(order);
          const customer = users.find((user) => user.id === order.order.userId) ?? null;
          this.customer.set(customer);
        },
        error: (error: Error) => {
          this.orderRecord.set(null);
          this.customer.set(null);
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar el detalle',
            description: error.message || 'Valida la conexion con el servicio de pedidos.'
          });
        }
      });
  }

  private resolveStatus(status: number): StatusMeta {
    if (status === 1) {
      return { label: 'Creada', badgeClass: 'bg-slate-100 text-slate-700', progressStep: 1 };
    }
    if (status === 2) {
      return { label: 'Pagada', badgeClass: 'bg-cyan-100 text-cyan-700', progressStep: 2 };
    }
    if (status === 3) {
      return { label: 'En recoleccion', badgeClass: 'bg-blue-100 text-blue-700', progressStep: 3 };
    }
    if (status === 4) {
      return { label: 'En proceso', badgeClass: 'bg-indigo-100 text-indigo-700', progressStep: 4 };
    }
    if (status === 5) {
      return { label: 'En entrega', badgeClass: 'bg-violet-100 text-violet-700', progressStep: 5 };
    }
    if (status === 6) {
      return { label: 'Completada', badgeClass: 'bg-emerald-100 text-emerald-700', progressStep: 6 };
    }
    if (status === 7) {
      return { label: 'Cancelada', badgeClass: 'bg-rose-100 text-rose-700', progressStep: 0 };
    }

    return { label: `Estado ${status}`, badgeClass: 'bg-slate-100 text-slate-700', progressStep: 0 };
  }

  private parsePickupDateTime(pickupDate: string, pickupTime: string): Date | null {
    if (!pickupDate) {
      return null;
    }

    const safeTime = pickupTime?.trim().length > 0 ? pickupTime : '00:00:00';
    const normalizedTime = safeTime.length === 5 ? `${safeTime}:00` : safeTime;
    const parsed = new Date(`${pickupDate}T${normalizedTime}`);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }

  private toDate(value: string | Date | null): Date | null {
    if (!value) {
      return null;
    }

    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      return null;
    }
    return parsed;
  }
}
