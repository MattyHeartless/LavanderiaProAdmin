export interface LoginAdminRequest {
  email: string;
  password: string;
}

export interface RegisterCourierRequest {
  fullName: string;
  email: string;
  password: string;
  phoneNumber: string;
}

export interface RegisterCourierResponse {
  id: string;
  email: string;
  fullName: string;
}

export interface CourierAccountExistsResponse {
  exists: boolean;
}

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

export interface AdminProfile extends AuthUser {}

export interface LoginAdminRejected {
  message: string;
}

export type LoginAdminResponse = AdminProfile | LoginAdminRejected;

export function isAdminProfile(response: LoginAdminResponse): response is AdminProfile {
  return (
    typeof (response as AdminProfile).id === 'string' &&
    typeof (response as AdminProfile).email === 'string' &&
    typeof (response as AdminProfile).fullName === 'string'
  );
}
