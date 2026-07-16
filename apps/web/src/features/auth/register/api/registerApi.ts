import api from '../../../../api/axios';

export const registerApi = {
  sendOtp: async (email: string) => {
    const res = await api.post('/api/auth/register/send-otp', { email });
    return res.data;
  },
  register: async (data: any) => {
    const res = await api.post('/api/auth/register', data);
    return res.data;
  }
};
