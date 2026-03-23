import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListOrdersResponse, OrderEvidence, OrderRecord } from './orders.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly ordersPath = environment.ordersApiUrl;

  listOrders(): Observable<OrderRecord[]> {
    return this.http
      .get<ListOrdersResponse>(this.ordersPath)
      .pipe(
        map((response) => (Array.isArray(response?.data) ? response.data : [])),
        catchError((error) => throwError(() => new Error(this.getErrorMessage(error, 'No se pudo cargar pedidos.'))))
      );
  }

  getOrderById(orderId: string): Observable<OrderRecord | null> {
    return this.listOrders().pipe(map((orders) => orders.find((item) => item.order.id === orderId) ?? null));
  }

  getOrderEvidences(orderId: string): Observable<OrderEvidence[]> {
    return this.http.get<OrderEvidence[]>(`${this.ordersPath}/${orderId}/evidences`).pipe(
      map((response) => (Array.isArray(response) ? response : [])),
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error, 'No se pudo cargar evidencias.'))))
    );
  }

  getEvidenceImage(evidenceId: string): Observable<Blob> {
    return this.http.get(`${this.ordersPath}/evidences/${evidenceId}/image`, { responseType: 'blob' }).pipe(
      catchError((error) => throwError(() => new Error(this.getErrorMessage(error, 'No se pudo abrir la evidencia.'))))
    );
  }

  private getErrorMessage(error: unknown, fallbackMessage: string): string {
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
        return 'No se pudo conectar con el servicio de pedidos.';
      }
    }

    return fallbackMessage;
  }
}
