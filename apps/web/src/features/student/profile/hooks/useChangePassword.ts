import { useMutation } from '@tanstack/react-query';
import { changePasswordApi } from '../api/changePasswordApi';
import type { ChangePasswordPayload } from '../types';

export const useChangePasswordOtp = () => {
  return useMutation({
    mutationFn: () => changePasswordApi.sendOtp(),
  });
};

export const useChangePassword = () => {
  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) => changePasswordApi.changePassword(payload),
  });
};
