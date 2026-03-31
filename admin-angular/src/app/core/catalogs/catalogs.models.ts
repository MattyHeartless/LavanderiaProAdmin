export interface CatalogService {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  icon: string;
  themeIcon: string;
  pricingOptions: ServicePricingOption[];
}

export interface ServicePricingOption {
  id: string;
  serviceId: string;
  optionName: ServicePricingOptionName;
  price: number;
  uoM: ServicePricingOptionUom;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServicePricingOptionPayload {
  optionName: ServicePricingOptionName;
  price: number;
  uoM: ServicePricingOptionUom;
  isActive: boolean;
}

export interface ServiceFormValue {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  icon: string;
  themeIcon: string;
  pricingOptions: ServicePricingOption[];
}

export type ServicePricingOptionName =
  | 'Por kilo'
  | 'Por pieza'
  | 'Por docena'
  | 'Bulto pequeño'
  | 'Bulto mediano'
  | 'Bulto grande'
  | 'Bulto jumbo';

export type ServicePricingOptionUom = 'KG' | 'PZ' | 'DOC' | 'BULTO';

export interface ServiceOptionCatalogItem {
  optionName: ServicePricingOptionName;
  uoM: ServicePricingOptionUom;
}

export interface ListServicesResponse {
  services: CatalogService[];
}

export interface GetServiceResponse {
  service: CatalogService;
}

export interface ListServicePricingOptionsResponse {
  message?: string;
  data?: ServicePricingOption[];
  pricingOptions?: ServicePricingOption[];
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
