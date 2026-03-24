import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';
import {
  CatalogService,
  Coupon,
  CreateCouponRequest,
  Courier,
  DeleteMessageResponse,
  GetCouponResponse,
  GetCourierResponse,
  GetServiceResponse,
  ListCouponsResponse,
  ListCouriersResponse,
  ListServicesResponse,
  MutationMessageResponse,
  UpdateCouponRequest
} from './catalogs.models';

@Injectable({ providedIn: 'root' })
export class CatalogsService {
  private readonly http = inject(HttpClient);
  private readonly servicesPath = `${environment.catalogsApiUrl}/services`;
  private readonly couriersPath = `${environment.catalogsApiUrl}/couriers`;
  private readonly couponsPath = `${environment.catalogsApiUrl}/coupons`;

  listServices(): Observable<ListServicesResponse> {
    return this.http.get<ListServicesResponse>(this.servicesPath);
  }

  getServiceById(id: string): Observable<GetServiceResponse> {
    return this.http.get<GetServiceResponse>(`${this.servicesPath}/${id}`);
  }

  createService(payload: CatalogService): Observable<MutationMessageResponse> {
    return this.http.post<MutationMessageResponse>(this.servicesPath, payload);
  }

  updateService(id: string, payload: CatalogService): Observable<MutationMessageResponse> {
    return this.http.put<MutationMessageResponse>(`${this.servicesPath}/${id}`, payload);
  }

  deleteService(id: string): Observable<DeleteMessageResponse> {
    return this.http.delete<DeleteMessageResponse>(`${this.servicesPath}/${id}`);
  }

  listCouriers(): Observable<ListCouriersResponse> {
    return this.http.get<ListCouriersResponse>(this.couriersPath);
  }

  getCourierById(id: string): Observable<GetCourierResponse> {
    return this.http.get<GetCourierResponse>(`${this.couriersPath}/${id}`);
  }

  createCourier(payload: Courier): Observable<MutationMessageResponse> {
    return this.http.post<MutationMessageResponse>(this.couriersPath, payload);
  }

  updateCourier(id: string, payload: Courier): Observable<MutationMessageResponse> {
    return this.http.put<MutationMessageResponse>(`${this.couriersPath}/${id}`, payload);
  }

  deleteCourier(id: string): Observable<DeleteMessageResponse> {
    return this.http.delete<DeleteMessageResponse>(`${this.couriersPath}/${id}`);
  }

  listCoupons(): Observable<ListCouponsResponse> {
    return this.http.get<ListCouponsResponse>(this.couponsPath);
  }

  getCouponById(id: string): Observable<GetCouponResponse> {
    return this.http.get<GetCouponResponse>(`${this.couponsPath}/${id}`);
  }

  createCoupon(payload: CreateCouponRequest): Observable<MutationMessageResponse<Coupon>> {
    return this.http.post<MutationMessageResponse<Coupon>>(this.couponsPath, payload);
  }

  updateCoupon(id: string, payload: UpdateCouponRequest): Observable<MutationMessageResponse<Coupon>> {
    return this.http.put<MutationMessageResponse<Coupon>>(`${this.couponsPath}/${id}`, payload);
  }

  deleteCoupon(id: string): Observable<DeleteMessageResponse> {
    return this.http.delete<DeleteMessageResponse>(`${this.couponsPath}/${id}`);
  }
}
