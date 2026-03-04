import { Component, ViewChild, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { CatalogService } from '../../core/catalogs/catalogs.models';
import { CatalogsService } from '../../core/catalogs/catalogs.service';
import { NotificationService } from '../../core/notifications/notification.service';
import { ServiceFormComponent } from './components/service-form.component';
import { ServiceListComponent } from './components/service-list.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-services-page',
  standalone: true,
  imports: [ServiceListComponent, ServiceFormComponent],
  templateUrl: './services-page.component.html',
  styleUrl: './services-page.component.scss'
})
export class ServicesPageComponent {
  private readonly catalogsService = inject(CatalogsService);
  private readonly notificationService = inject(NotificationService);
  @ViewChild(ServiceFormComponent) private serviceFormComponent?: ServiceFormComponent;

  readonly services = signal<CatalogService[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly selectedService = signal<CatalogService | null>(null);

  constructor() {
    this.loadServices();
  }

  startCreate(scrollToForm = false): void {
    this.formMode.set('create');
    this.selectedService.set(null);
    if (scrollToForm) {
      setTimeout(() => {
        this.serviceFormComponent?.focusNameInput();
      });
    }
  }

  startEdit(service: CatalogService, scrollToForm = false): void {
    this.formMode.set('edit');
    this.selectedService.set(service);
    if (scrollToForm) {
      setTimeout(() => {
        this.serviceFormComponent?.focusNameInput();
      });
    }
  }

  cancelForm(): void {
    this.startCreate();
  }

  saveService(payload: CatalogService): void {
    if (this.formMode() === 'create') {
      this.createService(payload);
      return;
    }
    this.updateService(payload);
  }

  deleteService(service: CatalogService): void {
    const confirmation = window.confirm(`Se eliminara el servicio "${service.name}". ¿Deseas continuar?`);
    if (!confirmation) {
      return;
    }

    this.submitting.set(true);
    this.catalogsService
      .deleteService(service.id)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Servicio eliminado',
            description: response.message
          });
          this.loadServices();
          if (this.selectedService()?.id === service.id) {
            this.startCreate();
          }
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al eliminar',
            description: error.message || 'No fue posible eliminar el servicio.'
          });
        }
      });
  }

  private loadServices(): void {
    this.loading.set(true);
    this.catalogsService
      .listServices()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.services.set(response.services ?? []);
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar servicios',
            description: error.message || 'Valida la conexion con el microservicio de catalogos.'
          });
        }
      });
  }

  private createService(payload: CatalogService): void {
    this.submitting.set(true);
    const createPayload: CatalogService = {
      ...payload,
      id: this.generateGuid()
    };

    this.catalogsService
      .createService(createPayload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Servicio creado',
            description: response.message
          });
          this.loadServices();
          this.startCreate();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al crear servicio',
            description: error.message || 'No fue posible guardar el servicio.'
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

  private updateService(payload: CatalogService): void {
    this.submitting.set(true);
    this.catalogsService
      .updateService(payload.id, payload)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.notificationService.show({
            type: 'success',
            title: 'Servicio actualizado',
            description: response.message
          });
          this.loadServices();
          this.startCreate();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'Error al actualizar',
            description: error.message || 'No fue posible actualizar el servicio.'
          });
        }
      });
  }
}
