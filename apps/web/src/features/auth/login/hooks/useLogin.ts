import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../../../store/authStore';
import { loginApi } from '../api/loginApi';

export const useLogin = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (credentials: any) => {
    setLoading(true);
    setError('');
    try {
      const { token, user } = await loginApi.login(credentials);
      login(token, user);
      
      // Redirect based on role
      if (user.role === 'teacher') navigate('/teacher');
      else if (user.role === 'parent') navigate('/parent');
      else navigate('/student');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.response?.data?.message || t('auth.login.errorLoginFailed');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { handleLogin, loading, error, setError };
};
