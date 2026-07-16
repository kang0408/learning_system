import type { UpdateProfilePayload, ProfileUpdateResponse } from '../types';

export const studentProfileApi = {
  updateProfile: async (payload: UpdateProfilePayload, token: string): Promise<ProfileUpdateResponse> => {
    const data = new FormData();
    if (payload.full_name) data.append('full_name', payload.full_name);
    if (payload.phone) data.append('phone', payload.phone);
    if (payload.address) data.append('address', payload.address);
    if (payload.avatar) data.append('avatar', payload.avatar);

    const res = await fetch('http://localhost:5000/api/users/me', {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: data
    });

    return res.json();
  }
};
