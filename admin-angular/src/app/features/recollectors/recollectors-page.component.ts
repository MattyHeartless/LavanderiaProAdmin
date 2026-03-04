import { Component, ViewChild, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { CatalogsService } from '../../core/catalogs/catalogs.service';
import { Courier } from '../../core/catalogs/catalogs.models';
import { NotificationService } from '../../core/notifications/notification.service';
import { CourierFormComponent } from './components/courier-form.component';
import { CourierListComponent } from './components/courier-list.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-recollectors-page',
  standalone: true,
  imports: [CourierListComponent, CourierFormComponent],
  templateUrl: './recollectors-page.component.html',
  styleUrl: './recollectors-page.component.scss'
})
export class RecollectorsPageComponent {
  private readonly catalogsService = inject(CatalogsService);
  private readonly notificationService = inject(NotificationService);
  @ViewChild(CourierFormComponent) private courierFormComponent?: CourierFormComponent;

  readonly couriers = signal<Courier[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly selectedCourier = signal<Courier | null>(null);

  constructor() {
    this.loadCouriers();
  }

  startCreate(scrollToForm = false): void {
    this.formMode.set('create');
    this.selectedCourier.set(null);
    this.courierFormComponent?.resetForCreate();
    if (scrollToForm) {
      setTimeout(() => {
        this.courierFormComponent?.focusNameInput();
      });
    }
  }

  startEdit(courier: Courier, scrollToForm = false): void {
    this.formMode.set('edit');
    this.selectedCourier.set(courier);
    if (scrollToForm) {
      setTimeout(() => {
        this.courierFormComponent?.focusNameInput();
      });
    }
  }

  cancelForm(): void {
    this.startCreate();
  }

  saveCourier(payload: Courier): void {
    if (this.formMode() === 'create') {
      this.createCourier(payload);
      return;
    }
    this.updateCourier(payload);
  }

  deleteCourier(courier: Courier): void {
    const confirmation = window.confirm(`Se eliminara el recolector "${courier.name} ${courier.lastName}". ¿Deseas continuar?`);
    if (!confirmation) {
      return;
    }

    this.submitting.set(true);
    this.catalogsService
      .deleteCourier(courier.id)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Recolector eliminado',
            description: response.message
          });
          this.loadCouriers();
          if (this.selectedCourier()?.id === courier.id) {
            this.startCreate();
          }
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al eliminar',
            description: error.message || 'No fue posible eliminar el recolector.'
          });
        }
      });
  }

  private loadCouriers(): void {
    this.loading.set(true);
    this.catalogsService
      .listCouriers()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.couriers.set(response.couriers ?? []);
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar recolectores',
            description: error.message || 'Valida la conexion con el microservicio de catalogos.'
          });
        }
      });
  }

  private createCourier(payload: Courier): void {
    this.submitting.set(true);
    const createPayload: Courier = {
      ...payload,
      id: this.generateGuid()
    };

    this.catalogsService
      .createCourier(createPayload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Recolector creado',
            description: response.message
          });
          this.loadCouriers();
          this.startCreate();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al crear recolector',
            description: error.message || 'No fue posible guardar el recolector.'
          });
        }
      });
  }

  private updateCourier(payload: Courier): void {
    this.submitting.set(true);
    this.catalogsService
      .updateCourier(payload.id, payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Recolector actualizado',
            description: response.message
          });
          this.loadCouriers();
          this.startCreate();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al actualizar',
            description: error.message || 'No fue posible actualizar el recolector.'
          });
        }
      });
  }

  private generateGuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}
