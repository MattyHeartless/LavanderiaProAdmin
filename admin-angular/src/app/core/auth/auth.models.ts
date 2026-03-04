export interface LoginAdminRequest {
  email: string;
  password: string;
}

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
}

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
