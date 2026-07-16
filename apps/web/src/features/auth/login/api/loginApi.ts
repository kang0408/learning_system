import api from '../../../../api/axios';

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export const loginApi = {
  login: async (credentials: any): Promise<LoginResponse> => {
    const res = await api.post('/api/auth/login', credentials);
    return res.data.data;
  }
};
