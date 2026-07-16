import { useMutation } from '@tanstack/react-query';
import { studentProfileApi } from '../api/studentProfileApi';
import type { UpdateProfilePayload, ProfileUpdateResponse } from '../types';

export const useProfileUpdate = () => {
  return useMutation({
    mutationFn: ({ payload, token }: { payload: UpdateProfilePayload; token: string }): Promise<ProfileUpdateResponse> => 
      studentProfileApi.updateProfile(payload, token),
  });
};
