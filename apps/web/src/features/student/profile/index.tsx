import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useProfileUpdate } from './hooks/useProfileUpdate';
import { ProfileHeader } from './components/ProfileHeader';
import { AvatarUpload } from './components/AvatarUpload';
import { ProfileForm } from './components/ProfileForm';
import { ChangePasswordForm } from './components/ChangePasswordForm';

export const StudentProfileFeature: React.FC = () => {
  const { user, token, login } = useAuthStore();
  const { t } = useTranslation();
  const { mutateAsync: updateProfile, isPending: isSubmitting } = useProfileUpdate();

  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setMessage(null);

    try {
      const payload = {
        ...formData,
        avatar: avatarFile
      };

      const result = await updateProfile({ payload, token });

      if (result.success) {
        // Update global user state
        login(token, result.data);
        setMessage({ type: 'success', text: t('student.profile.successUpdate') });
      } else {
        setMessage({ type: 'error', text: result.error?.message || t('student.profile.errorUpdate') });
      }
    } catch (err) {
      setMessage({ type: 'error', text: t('student.profile.networkError') });
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 md:gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <ProfileHeader />

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
        <AvatarUpload 
          user={user}
          avatarFile={avatarFile}
          onFileChange={(file) => {
            setAvatarFile(file);
            setMessage(null);
          }}
          onError={(msg) => setMessage({ type: 'error', text: msg })}
        />

        <ProfileForm 
          formData={formData}
          message={message}
          isSubmitting={isSubmitting}
          onClearMessage={() => setMessage(null)}
          onChange={handleChange}
        />
      </form>

      <ChangePasswordForm />
    </div>
  );
};

export default StudentProfileFeature;
