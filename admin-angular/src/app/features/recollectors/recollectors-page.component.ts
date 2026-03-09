import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { catchError, finalize, map, of, switchMap } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { CatalogsService } from '../../core/catalogs/catalogs.service';
import { Courier } from '../../core/catalogs/catalogs.models';
import { NotificationService } from '../../core/notifications/notification.service';
import { CourierFormComponent } from './components/courier-form.component';
import { CourierListComponent } from './components/courier-list.component';

type FormMode = 'create' | 'edit';

@Component({
  selector: 'app-recollectors-page',
  standalone: true,
  imports: [CourierListComponent, CourierFormComponent, ReactiveFormsModule],
  templateUrl: './recollectors-page.component.html',
  styleUrl: './recollectors-page.component.scss'
})
export class RecollectorsPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly catalogsService = inject(CatalogsService);
  private readonly notificationService = inject(NotificationService);
  @ViewChild(CourierFormComponent) private courierFormComponent?: CourierFormComponent;

  readonly couriers = signal<Courier[]>([]);
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly formMode = signal<FormMode>('create');
  readonly selectedCourier = signal<Courier | null>(null);
  readonly accessModalOpen = signal(false);
  readonly selectedAccessCourier = signal<Courier | null>(null);
  readonly selectedAccessFullName = signal('');
  readonly selectedAccessPhoneNumber = signal('');
  readonly accessSubmitting = signal(false);
  readonly accessAccountCheckLoading = signal(false);
  readonly accessAccountExists = signal<boolean | null>(null);
  readonly accessEmailLocked = signal(false);
  readonly accessAccountForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email, Validators.maxLength(120)]],
    password: ['', [Validators.required, Validators.minLength(10)]]
  });

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

  openCreateAccessModal(courier: Courier): void {
    const shouldLockEmail = Boolean(courier.authUserId?.trim());
    this.selectedAccessCourier.set(courier);
    this.selectedAccessFullName.set(this.buildCourierFullName(courier));
    this.selectedAccessPhoneNumber.set(courier.phoneNumber);
    this.accessAccountExists.set(null);
    this.accessAccountForm.reset({
      email: '',
      password: this.generateSecurePassword()
    });
    this.setAccessEmailLockState(shouldLockEmail);
    this.accessModalOpen.set(true);
    this.runInitialAccountValidation(courier);
  }

  closeCreateAccessModal(): void {
    this.accessModalOpen.set(false);
    this.selectedAccessCourier.set(null);
    this.selectedAccessFullName.set('');
    this.selectedAccessPhoneNumber.set('');
    this.accessAccountExists.set(null);
    this.accessAccountCheckLoading.set(false);
    this.setAccessEmailLockState(false);
  }

  autoGenerateAccessPassword(): void {
    this.accessAccountForm.controls.password.setValue(this.generateSecurePassword());
    this.accessAccountForm.controls.password.markAsDirty();
  }

  validateAccessAccountByEmail(): void {
    if (this.accessEmailLocked()) {
      return;
    }

    const email = this.accessAccountForm.controls.email.value.trim();
    if (!email) {
      this.accessAccountExists.set(false);
      return;
    }

    this.accessAccountCheckLoading.set(true);
    this.authService
      .checkCourierAccountExists(email)
      .pipe(
        finalize(() => {
          this.accessAccountCheckLoading.set(false);
        })
      )
      .subscribe({
        next: (response) => {
          this.accessAccountExists.set(Boolean(response.exists));
        },
        error: (error: Error) => {
          this.accessAccountExists.set(null);
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible validar la cuenta',
            description: error.message || 'Valida la conexion con el servicio de autenticacion.'
          });
        }
      });
  }

  submitAccessAccount(): void {
    if (this.accessAccountCheckLoading()) {
      return;
    }

    if (this.accessAccountExists() === true) {
      this.requestDeleteCourierAccount();
      return;
    }

    if (this.accessAccountForm.invalid) {
      this.accessAccountForm.markAllAsTouched();
      return;
    }

    const fullName = this.selectedAccessFullName().trim();
    const phoneNumber = this.selectedAccessPhoneNumber().trim();
    if (!fullName || !phoneNumber) {
      this.notificationService.show({
        type: 'error',
        title: 'Datos incompletos',
        description: 'No se pudo obtener el nombre completo o telefono del recolector.'
      });
      return;
    }

    const formValue = this.accessAccountForm.getRawValue();
    this.accessSubmitting.set(true);
    this.authService
      .registerCourier({
        fullName,
        email: formValue.email.trim(),
        password: formValue.password,
        phoneNumber
      })
      .pipe(
        switchMap((response) => {
          const courierToLink = this.selectedAccessCourier();
          if (!courierToLink) {
            return of({
              response,
              linkUpdated: false,
              linkSkipped: true,
              linkErrorMessage: ''
            });
          }

          const updatePayload: Courier = {
            ...courierToLink,
            authUserId: response.id
          };

          return this.catalogsService.updateCourier(courierToLink.id, updatePayload).pipe(
            map(() => ({
              response,
              linkUpdated: true,
              linkSkipped: false,
              linkErrorMessage: ''
            })),
            catchError((error: Error) =>
              of({
                response,
                linkUpdated: false,
                linkSkipped: false,
                linkErrorMessage: error.message || 'No fue posible ligar la cuenta al recolector.'
              })
            )
          );
        }),
        finalize(() => {
          this.accessSubmitting.set(false);
        })
      )
      .subscribe({
        next: (result) => {
          this.notificationService.show({
            type: 'success',
            title: 'Cuenta creada',
            description: `Se creo la cuenta para ${result.response.fullName} (${result.response.email}).`
          });

          if (!result.linkSkipped && !result.linkUpdated) {
            this.notificationService.show({
              type: 'warning',
              title: 'Cuenta creada sin vinculo',
              description: result.linkErrorMessage
            });
          }

          if (result.linkUpdated) {
            this.loadCouriers();
          }

          this.closeCreateAccessModal();
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible crear la cuenta',
            description: error.message || 'Valida la disponibilidad del servicio de autenticacion.'
          });
        }
      });
  }

  private runInitialAccountValidation(courier: Courier): void {
    const authUserId = courier.authUserId?.trim();
    if (!authUserId) {
      this.accessAccountForm.controls.email.setValue('');
      this.accessAccountExists.set(false);
      return;
    }

    this.accessAccountCheckLoading.set(true);
    this.authService
      .listUsers()
      .pipe(
        map((users) => {
          const matchedUser = users.find((user) => user.id === authUserId);
          return matchedUser?.email?.trim() ?? '';
        }),
        switchMap((email) => {
          this.accessAccountForm.controls.email.setValue(email);
          if (!email) {
            return of({ email: '', exists: false });
          }
          return this.authService
            .checkCourierAccountExists(email)
            .pipe(map((response) => ({ email, exists: Boolean(response.exists) })));
        }),
        finalize(() => {
          this.accessAccountCheckLoading.set(false);
        })
      )
      .subscribe({
        next: (result) => {
          this.accessAccountExists.set(result.exists);
        },
        error: (error: Error) => {
          this.accessAccountExists.set(null);
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible validar la cuenta',
            description: error.message || 'Valida la conexion con el servicio de autenticacion.'
          });
        }
      });
  }

  private requestDeleteCourierAccount(): void {
    const email = this.accessAccountForm.controls.email.value.trim();
    if (!email) {
      this.notificationService.show({
        type: 'warning',
        title: 'Correo requerido',
        description: 'No se encontro un correo para eliminar la cuenta.'
      });
      return;
    }

    this.notificationService.show({
      type: 'info',
      title: 'Cuenta detectada',
      description: `La cuenta ${email} ya existe. Comparte el endpoint de eliminacion para conectarlo.`
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
    const normalizedAuthUserId = payload.authUserId?.trim() || null;
    const createPayload: Courier = {
      ...payload,
      id: this.generateGuid(),
      authUserId: normalizedAuthUserId
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
    const updatePayload: Courier = {
      ...payload,
      authUserId: payload.authUserId?.trim() || null
    };
    this.catalogsService
      .updateCourier(payload.id, updatePayload)
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

  private generateSecurePassword(length = 10): string {
    const lowercaseChars = 'abcdefghijklmnopqrstuvwxyz';
    const uppercaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numberChars = '0123456789';
    const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    const allChars = `${lowercaseChars}${uppercaseChars}${numberChars}${specialChars}`;

    const passwordChars = [
      this.pickRandomChar(lowercaseChars),
      this.pickRandomChar(uppercaseChars),
      this.pickRandomChar(numberChars),
      this.pickRandomChar(specialChars)
    ];

    while (passwordChars.length < length) {
      passwordChars.push(this.pickRandomChar(allChars));
    }

    return this.shuffleChars(passwordChars).join('');
  }

  private pickRandomChar(source: string): string {
    return source[this.getRandomInt(source.length)];
  }

  private shuffleChars(chars: string[]): string[] {
    for (let index = chars.length - 1; index > 0; index -= 1) {
      const randomIndex = this.getRandomInt(index + 1);
      [chars[index], chars[randomIndex]] = [chars[randomIndex], chars[index]];
    }
    return chars;
  }

  private getRandomInt(maxExclusive: number): number {
    if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
      const randomValues = new Uint32Array(1);
      crypto.getRandomValues(randomValues);
      return randomValues[0] % maxExclusive;
    }
    return Math.floor(Math.random() * maxExclusive);
  }

  private buildCourierFullName(courier: Courier): string {
    return [courier.name, courier.middleName, courier.lastName]
      .filter((value) => Boolean(value && value.trim()))
      .join(' ');
  }

  private setAccessEmailLockState(locked: boolean): void {
    this.accessEmailLocked.set(locked);
    if (locked) {
      this.accessAccountForm.controls.email.disable({ emitEvent: false });
      return;
    }
    this.accessAccountForm.controls.email.enable({ emitEvent: false });
  }
}
