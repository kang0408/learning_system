import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { registerApi } from '../api/registerApi';

export const useRegister = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2>(1);
  const navigate = useNavigate();

  const handleSendOtp = async (email: string) => {
    setLoading(true);
    setError('');
    try {
      await registerApi.sendOtp(email);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || t('auth.register.errorSendOtp'));
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (data: any) => {
    setLoading(true);
    setError('');
    try {
      await registerApi.register(data);
      navigate('/login?registered=true');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || t('auth.register.errorRegisterFailed'));
    } finally {
      setLoading(false);
    }
  };

  return { step, loading, error, setError, handleSendOtp, handleRegister, setStep };
};
