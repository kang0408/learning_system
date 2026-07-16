import api from '../../../../api/axios';
import type { ChangePasswordPayload, ChangePasswordResponse } from '../types';

export const changePasswordApi = {
  sendOtp: async (): Promise<{ success: boolean; data?: any; error?: string; message?: string }> => {
    const response = await api.post('/api/auth/change-password/send-otp');
    return response.data;
  },
  changePassword: async (payload: ChangePasswordPayload): Promise<ChangePasswordResponse> => {
    const response = await api.patch('/api/auth/change-password', payload);
    return response.data;
  }
};
