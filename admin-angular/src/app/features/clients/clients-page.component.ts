import { Component, inject, signal } from '@angular/core';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/auth/auth.service';
import { AuthUser } from '../../core/auth/auth.models';
import { NotificationService } from '../../core/notifications/notification.service';

@Component({
  selector: 'app-clients-page',
  standalone: true,
  imports: [],
  templateUrl: './clients-page.component.html',
  styleUrl: './clients-page.component.scss'
})
export class ClientsPageComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly users = signal<AuthUser[]>([]);
  readonly loading = signal(false);

  constructor() {
    this.loadUsers();
  }

  trackById(_index: number, user: AuthUser): string {
    return user.id;
  }

  private loadUsers(): void {
    this.loading.set(true);
    this.authService
      .listUsers()
      .pipe(
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({
        next: (users) => {
          this.users.set(users ?? []);
        },
        error: (error: Error) => {
          this.notificationService.show({
            type: 'error',
            title: 'No fue posible cargar clientes',
            description: error.message || 'Valida la conexion con el servicio de autenticacion.'
          });
        }
      });
  }
}
