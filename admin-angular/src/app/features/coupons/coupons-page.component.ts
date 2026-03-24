import { Component, ViewChild, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { CatalogsService } from '../../core/catalogs/catalogs.service';
import { Coupon, CreateCouponRequest } from '../../core/catalogs/catalogs.models';
import { NotificationService } from '../../core/notifications/notification.service';
import { CouponFormComponent, CouponFormValue } from './components/coupon-form.component';
import { CouponListComponent } from './components/coupon-list.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-coupons-page',
  standalone: true,
  imports: [CouponListComponent, CouponFormComponent],
  templateUrl: './coupons-page.component.html',
  styleUrl: './coupons-page.component.scss'
})
export class CouponsPageComponent {
  private readonly catalogsService = inject(CatalogsService);
  private readonly notificationService = inject(NotificationService);
  @ViewChild(CouponFormComponent) private couponFormComponent?: CouponFormComponent;

  readonly coupons = signal<Coupon[]>([]);
  readonly loading = signal(false);
  readonly loadingSelectedCoupon = signal(false);
  readonly submitting = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly selectedCoupon = signal<Coupon | null>(null);

  constructor() {
    this.loadCoupons();
  }

  startCreate(scrollToForm = false): void {
    this.formMode.set('create');
    this.selectedCoupon.set(null);
    if (scrollToForm) {
      setTimeout(() => {
        this.couponFormComponent?.focusPrimaryInput();
      });
    }
  }

  startEdit(coupon: Coupon, scrollToForm = false): void {
    this.formMode.set('edit');
    this.loadingSelectedCoupon.set(true);
    this.catalogsService
      .getCouponById(coupon.id)
      .pipe(
        finalize(() => {
          this.loadingSelectedCoupon.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.selectedCoupon.set(response.coupon);
          if (scrollToForm) {
            setTimeout(() => {
              this.couponFormComponent?.focusPrimaryInput();
            });
          }
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar el cupon',
            description: error.message || 'Intenta de nuevo para editar el cupon.'
          });
        }
      });
  }

  cancelForm(): void {
    this.startCreate();
  }

  saveCoupon(payload: CouponFormValue): void {
    if (this.formMode() === 'create') {
      this.createCoupon(payload);
      return;
    }
    this.updateCoupon(payload);
  }

  deleteCoupon(coupon: Coupon): void {
    const confirmation = window.confirm(`Se eliminara el cupon "${coupon.code}". ¿Deseas continuar?`);
    if (!confirmation) {
      return;
    }

    this.submitting.set(true);
    this.catalogsService
      .deleteCoupon(coupon.id)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Cupon eliminado',
            description: response.message
          });
          this.loadCoupons();
          if (this.selectedCoupon()?.id === coupon.id) {
            this.startCreate();
          }
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al eliminar',
            description: error.message || 'No fue posible eliminar el cupon.'
          });
        }
      });
  }

  private loadCoupons(): void {
    this.loading.set(true);
    this.catalogsService
      .listCoupons()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.coupons.set(response.coupons ?? []);
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar cupones',
            description: error.message || 'Valida la conexion con el microservicio de catalogos.'
          });
        }
      });
  }

  private createCoupon(payload: CouponFormValue): void {
    this.submitting.set(true);
    const createPayload = this.buildMutationPayload(payload);

    this.catalogsService
      .createCoupon(createPayload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Cupon creado',
            description: response.message
          });
          this.loadCoupons();
          this.startCreate();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al crear cupon',
            description: error.message || 'No fue posible guardar el cupon.'
          });
        }
      });
  }

  private updateCoupon(payload: CouponFormValue): void {
    this.submitting.set(true);
    const updatePayload = this.buildMutationPayload(payload);

    this.catalogsService
      .updateCoupon(payload.id, updatePayload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Cupon actualizado',
            description: response.message
          });
          this.loadCoupons();
          this.startCreate();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al actualizar',
            description: error.message || 'No fue posible actualizar el cupon.'
          });
        }
      });
  }

  private buildMutationPayload(payload: CouponFormValue): CreateCouponRequest {
    const description = payload.description.trim();

    return {
      code: payload.code.trim().toUpperCase(),
      name: payload.name.trim(),
      description: description.length > 0 ? description : null,
      benefitType: payload.benefitType.trim(),
      benefitValue: Number(payload.benefitValue),
      eventType: payload.eventType,
      isActive: payload.isActive,
      expiresAt: payload.expiresAt,
      usageLimit: Number(payload.usageLimit)
    };
  }
}
