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
