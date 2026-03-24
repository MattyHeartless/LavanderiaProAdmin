export interface CatalogService {
  id: string;
  name: string;
  description: string;
  price: number;
  uoM: string;
  isActive: boolean;
  icon: string;
  themeIcon: string;
}

export interface ListServicesResponse {
  services: CatalogService[];
}

export interface GetServiceResponse {
  service: CatalogService;
}

export interface MutationMessageResponse<T = unknown> {
  message: string;
  data: T;
}

export interface DeleteMessageResponse {
  message: string;
  success: boolean;
}

export interface Courier {
  id: string;
  name: string;
  middleName: string;
  lastName: string;
  vehicle: string;
  address: string;
  neighborhood: string;
  zipCode: string;
  city: string;
  phoneNumber: string;
  authUserId?: string | null;
  isActive: boolean;
}

export interface ListCouriersResponse {
  couriers: Courier[];
}

export interface GetCourierResponse {
  courier: Courier;
}

export interface Coupon {
  id: string;
  code: string;
  name: string;
  description: string | null;
  benefitType: string;
  benefitValue: number;
  eventType: string;
  isActive: boolean;
  expiresAt: string;
  usageLimit: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCouponRequest {
  code: string;
  name: string;
  description: string | null;
  benefitType: string;
  benefitValue: number;
  eventType: string;
  isActive: boolean;
  expiresAt: string;
  usageLimit: number;
}

export type UpdateCouponRequest = CreateCouponRequest;

export interface ListCouponsResponse {
  coupons: Coupon[];
}

export interface GetCouponResponse {
  coupon: Coupon;
}
