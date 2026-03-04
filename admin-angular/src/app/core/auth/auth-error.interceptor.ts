import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { AuthService } from './auth.service';
import { NotificationService } from '../notifications/notification.service';

export const authErrorInterceptor: HttpInterceptorFn = (request, next) => {
  const authService = inject(AuthService);
  const notificationService = inject(NotificationService);
  const router = inject(Router);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      const isUnauthorized = error.status === 401 || error.status === 403;
      const isLoginRequest = request.url.includes('/api/Auth/login-admin');

      if (isUnauthorized && !isLoginRequest) {
        authService.clearSession();
        notificationService.show({
          type: 'warning',
          title: 'Sesion finalizada',
          description: 'Tu acceso expiro o ya no tienes permisos. Inicia sesion nuevamente.'
        });
        void router.navigate(['/login']);
      }

      return throwError(() => error);
    })
  );
};
