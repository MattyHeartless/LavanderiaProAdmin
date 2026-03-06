import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, map, tap, throwError } from 'rxjs';

import {
  AdminProfile,
  AuthUser,
  LoginAdminRequest,
  LoginAdminResponse,
  isAdminProfile
} from './auth.models';
import { environment } from '../../../environments/environment';

const ADMIN_SESSION_KEY = 'admin_session_v1';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly storage = this.loadStoredAdmin();
  private readonly usersPath = `${environment.apiBaseUrl}/api/Auth/users`;

  readonly currentAdmin = signal<AdminProfile | null>(this.storage);
  readonly isLoading = signal(false);
  readonly errorMessage = signal<string | null>(null);

  loginAdmin(payload: LoginAdminRequest, rememberSession: boolean): Observable<AdminProfile> {
    this.isLoading.set(true);
    this.errorMessage.set(null);

    return this.http
      .post<LoginAdminResponse>(`${environment.apiBaseUrl}/api/Auth/login-admin`, payload)
      .pipe(
        map((response) => {
          if (isAdminProfile(response)) {
            return response;
          }

          throw new Error(response.message || 'No tienes permisos de administrador.');
        }),
        tap((admin) => {
          this.persistAdmin(admin, rememberSession);
          this.currentAdmin.set(admin);
        }),
        catchError((error) => {
          const message = this.getErrorMessage(error);
          this.errorMessage.set(message);
          return throwError(() => new Error(message));
        }),
        finalize(() => {
          this.isLoading.set(false);
        })
      );
  }

  listUsers(): Observable<AuthUser[]> {
    return this.http.get<AuthUser[]>(this.usersPath).pipe(map((response) => (Array.isArray(response) ? response : [])));
  }

  clearSession(): void {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    localStorage.removeItem(ADMIN_SESSION_KEY);
    this.currentAdmin.set(null);
    this.errorMessage.set(null);
    this.isLoading.set(false);
  }

  hasActiveSession(): boolean {
    return this.currentAdmin() !== null;
  }

  private persistAdmin(admin: AdminProfile, rememberSession: boolean): void {
    const serializedAdmin = JSON.stringify(admin);
    if (rememberSession) {
      localStorage.setItem(ADMIN_SESSION_KEY, serializedAdmin);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
      return;
    }

    sessionStorage.setItem(ADMIN_SESSION_KEY, serializedAdmin);
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }

  private loadStoredAdmin(): AdminProfile | null {
    const savedAdmin = sessionStorage.getItem(ADMIN_SESSION_KEY) ?? localStorage.getItem(ADMIN_SESSION_KEY);
    if (!savedAdmin) {
      return null;
    }

    try {
      const parsed = JSON.parse(savedAdmin) as LoginAdminResponse;
      if (isAdminProfile(parsed)) {
        return parsed;
      }
      return null;
    } catch {
      return null;
    }
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
      return error.message;
    }

    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'object' && error.error && 'message' in error.error) {
        return String(error.error.message);
      }
      if (typeof error.error === 'string' && error.error.trim().length > 0) {
        return error.error;
      }
      if (error.status === 0) {
        return 'No se pudo conectar con el servicio de autenticacion.';
      }
      if (error.status === 401 || error.status === 403) {
        return 'Credenciales invalidas o sin permisos de administrador.';
      }
    }

    return 'No fue posible iniciar sesion. Intenta de nuevo.';
  }
}
