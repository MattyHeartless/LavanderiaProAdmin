import { Component, ViewChild, inject, signal } from '@angular/core';
import { catchError, finalize, forkJoin, map, of, switchMap } from 'rxjs';

import {
  CatalogService,
  ServiceFormValue,
  ServicePricingOption,
  ServicePricingOptionPayload,
  ServiceUpdatePayload
} from '../../core/catalogs/catalogs.models';
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
    const normalizedService = this.cloneService({
      ...service,
      pricingOptions: this.normalizePricingOptions(service.pricingOptions)
    });

    if (normalizedService.pricingOptions.length > 0) {
      this.selectedService.set(normalizedService);
      if (scrollToForm) {
        setTimeout(() => {
          this.serviceFormComponent?.focusNameInput();
        });
      }
      return;
    }

    this.catalogsService
      .listServicePricingOptions(service.id)
      .pipe(
        map((response) => this.normalizePricingOptions(response.data ?? response.pricingOptions)),
        catchError(() => of([] as ServicePricingOption[]))
      )
      .subscribe((pricingOptions) => {
        this.selectedService.set({
          ...normalizedService,
          pricingOptions
        });
        if (scrollToForm) {
          setTimeout(() => {
            this.serviceFormComponent?.focusNameInput();
          });
        }
      });
  }

  cancelForm(): void {
    this.startCreate();
  }

  saveService(payload: ServiceFormValue): void {
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
        switchMap((response) => {
          const services = (response.services ?? []).map((service) => ({
            ...service,
            pricingOptions: this.normalizePricingOptions(service.pricingOptions)
          }));

          if (services.length === 0) {
            return of([] as CatalogService[]);
          }

          return forkJoin(
            services.map((service) =>
              this.resolveServicePricingOptions(service).pipe(
                map((pricingResponse) => ({
                  ...service,
                  pricingOptions: pricingResponse
                }))
              )
            )
          );
        }),
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (services) => {
          this.services.set(services);
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

  private createService(payload: ServiceFormValue): void {
    this.submitting.set(true);
    const serviceId = this.generateGuid();
    const servicePayload = this.toServiceMutationPayload({
      ...payload,
      id: serviceId
    });

    this.catalogsService
      .createService(servicePayload)
      .pipe(
        switchMap(() => this.syncPricingOptions(serviceId, [], payload.pricingOptions)),
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.show({
            type: 'success',
            title: 'Servicio creado',
            description: 'El servicio y sus opciones de precio se guardaron correctamente.'
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

  private updateService(payload: ServiceFormValue): void {
    this.submitting.set(true);
    this.catalogsService
      .updateService(payload.id, this.toServiceUpdatePayload(payload))
      .pipe(
        finalize(() => {
          this.submitting.set(false);
        })
      )
      .subscribe({
        next: () => {
          this.notificationService.show({
            type: 'success',
            title: 'Servicio actualizado',
            description: 'El servicio y sus opciones de precio se actualizaron correctamente.'
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

  private syncPricingOptions(
    serviceId: string,
    previousOptions: ServicePricingOption[],
    nextOptions: ServicePricingOption[]
  ) {
    const previousById = new Map(previousOptions.map((option) => [option.id, option]));
    const deleteRequests = previousOptions
      .filter((option) => option.id && !nextOptions.some((candidate) => candidate.id === option.id))
      .map((option) => this.catalogsService.deleteServicePricingOption(serviceId, option.id));

    const saveRequests = nextOptions.map((option) => {
      const requestPayload: ServicePricingOptionPayload = {
        optionName: option.optionName,
        price: Number(option.price),
        uoM: option.uoM,
        isActive: option.isActive
      };

      if (!option.id || !previousById.has(option.id)) {
        return this.catalogsService.createServicePricingOption(serviceId, requestPayload);
      }

      return this.catalogsService.updateServicePricingOption(serviceId, option.id, requestPayload);
    });

    const requests = [...deleteRequests, ...saveRequests];
    if (requests.length === 0) {
      return of([]);
    }

    return forkJoin(requests);
  }

  private toServiceMutationPayload(payload: ServiceFormValue): Omit<CatalogService, 'pricingOptions'> {
    return {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      isActive: payload.isActive,
      icon: payload.icon,
      themeIcon: payload.themeIcon
    };
  }

  private toServiceUpdatePayload(payload: ServiceFormValue): ServiceUpdatePayload {
    const normalizedPricingOptions = this.normalizePricingOptions(payload.pricingOptions);
    const primaryOption = normalizedPricingOptions.find((option) => option.isActive) ?? normalizedPricingOptions[0];

    return {
      id: payload.id,
      name: payload.name,
      description: payload.description,
      price: primaryOption?.price ?? 0,
      uoM: primaryOption?.uoM ?? 'KG',
      isActive: payload.isActive,
      icon: payload.icon,
      themeIcon: payload.themeIcon,
      pricingOptions: normalizedPricingOptions
    };
  }

  private cloneService(service: CatalogService): CatalogService {
    return {
      ...service,
      pricingOptions: this.normalizePricingOptions(service.pricingOptions)
    };
  }

  private resolveServicePricingOptions(service: CatalogService) {
    const embeddedOptions = this.normalizePricingOptions(service.pricingOptions);
    if (embeddedOptions.length > 0) {
      return of(embeddedOptions);
    }

    return this.catalogsService.listServicePricingOptions(service.id).pipe(
      map((response) => this.normalizePricingOptions(response.data ?? response.pricingOptions)),
      catchError(() => of([] as ServicePricingOption[]))
    );
  }

  private normalizePricingOptions(options: ServicePricingOption[] | null | undefined): ServicePricingOption[] {
    if (!Array.isArray(options)) {
      return [];
    }

    return options.map((option) => ({
      ...option,
      price: Number(option.price)
    }));
  }

  private generateGuid(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  }
}
