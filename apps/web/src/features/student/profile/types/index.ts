export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  address?: string;
  avatar?: File | null;
}

export interface ProfileUpdateResponse {
  success: boolean;
  data?: any;
  error?: {
    message: string;
  };
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
  code: string;
}

export interface ChangePasswordResponse {
  success: boolean;
  data?: {
    message: string;
  };
  error?: string;
  message?: string; // Fallback from axios interceptor
}
