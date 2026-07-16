import api from '../../../../api/axios';

export const forgotPasswordApi = {
  forgotPassword: async (email: string) => {
    const res = await api.post('/api/auth/forgot-password', { email });
    return res.data;
  },
  verifyResetOtp: async (email: string, code: string) => {
    const res = await api.post('/api/auth/verify-reset-otp', { email, code });
    return res.data;
  },
  resetPassword: async (reset_token: string, new_password: string) => {
    const res = await api.post('/api/auth/reset-password', { reset_token, new_password });
    return res.data;
  }
};
