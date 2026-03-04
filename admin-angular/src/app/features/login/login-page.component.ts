import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationService } from '../../core/notifications/notification.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss'
})
export class LoginPageComponent {
  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly showPassword = signal(false);

  readonly loginForm = this.formBuilder.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
    remember: [false]
  });

  readonly isLoading = this.authService.isLoading;
  constructor() {
    if (this.authService.hasActiveSession()) {
      void this.router.navigateByUrl('/admin/dashboard');
    }
  }

  submit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.notificationService.show({
        type: 'warning',
        title: 'Formulario incompleto',
        description: 'Ingresa correo y contrasena validos para continuar.'
      });
      return;
    }

    const { email, password, remember } = this.loginForm.getRawValue();
    this.authService.loginAdmin({ email, password }, remember).subscribe({
      next: () => {
        this.notificationService.show({
          type: 'success',
          title: 'Acceso concedido',
          description: 'Bienvenido al panel administrativo.'
        });
        void this.router.navigateByUrl('/admin/dashboard');
      },
      error: (error: Error) => {
        this.notificationService.show({
          type: 'error',
          title: 'No fue posible iniciar sesion',
          description: error.message
        });
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((value) => !value);
  }

  isInvalid(controlName: 'email' | 'password'): boolean {
    const control = this.loginForm.controls[controlName];
    return control.invalid && (control.touched || control.dirty);
  }
}
