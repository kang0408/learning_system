import { useMutation } from '@tanstack/react-query';
import { teacherProfileApi } from '../api/teacherProfileApi';
import type { UpdateProfilePayload } from '../api/teacherProfileApi';
import { useAuthStore } from '@/store/authStore';

export const useUpdateTeacherProfile = () => {
  const { token, login } = useAuthStore();
  
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) => teacherProfileApi.updateProfile(payload),
    onSuccess: (data) => {
      if (data.success && token) {
        login(token, data.data);
      }
    },
  });
};
