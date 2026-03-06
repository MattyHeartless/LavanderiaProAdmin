import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { environment } from '../../../environments/environment';
import { ListOrdersResponse, OrderRecord } from './orders.models';

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly http = inject(HttpClient);
  private readonly ordersPath = `${environment.ordersApiBaseUrl}/api/Orders`;

  listOrders(): Observable<OrderRecord[]> {
    return this.http
      .get<ListOrdersResponse>(this.ordersPath)
      .pipe(map((response) => (Array.isArray(response?.data) ? response.data : [])));
  }

  getOrderById(orderId: string): Observable<OrderRecord | null> {
    return this.listOrders().pipe(map((orders) => orders.find((item) => item.order.id === orderId) ?? null));
  }
}
