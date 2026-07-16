import api from '@/api/axios';

export interface UpdateProfilePayload {
  full_name?: string;
  phone?: string;
  address?: string;
  avatar?: File;
}

export const teacherProfileApi = {
  updateProfile: async (payload: UpdateProfilePayload): Promise<any> => {
    const formData = new FormData();
    if (payload.full_name) formData.append('full_name', payload.full_name);
    if (payload.phone) formData.append('phone', payload.phone);
    if (payload.address) formData.append('address', payload.address);
    if (payload.avatar) formData.append('avatar', payload.avatar);

    const res = await api.patch('/api/users/me', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  }
};
