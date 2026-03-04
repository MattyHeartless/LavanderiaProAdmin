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

export interface MutationMessageResponse {
  message: string;
  data: unknown;
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
  isActive: boolean;
}

export interface ListCouriersResponse {
  couriers: Courier[];
}

export interface GetCourierResponse {
  courier: Courier;
}
