import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordApi } from '../api/forgotPasswordApi';

export const useForgotPassword = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async (userEmail: string) => {
    setLoading(true);
    setError('');
    try {
      await forgotPasswordApi.forgotPassword(userEmail);
      setEmail(userEmail);
      setStep(2);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || t('auth.forgotPassword.errorSendRequest'));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    setLoading(true);
    setError('');
    try {
      const res = await forgotPasswordApi.verifyResetOtp(email, code);
      setResetToken(res.data?.reset_token || res.reset_token);
      setStep(3);
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || t('auth.forgotPassword.errorInvalidOtp'));
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    setLoading(true);
    setError('');
    try {
      await forgotPasswordApi.resetPassword(resetToken, newPassword);
      navigate('/login?reset_success=true');
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || t('auth.forgotPassword.errorResetFailed'));
    } finally {
      setLoading(false);
    }
  };

  return {
    step,
    setStep,
    loading,
    error,
    setError,
    email,
    handleSendOtp,
    handleVerifyOtp,
    handleResetPassword
  };
};
