import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Save, Loader2, Mail, Phone, MapPin, Briefcase, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUpdateTeacherProfile } from '../hooks/useTeacherProfile';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useTranslation } from 'react-i18next';

interface ProfileFormProps {
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ onSuccess, onError }) => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { mutateAsync: updateProfile, isPending } = useUpdateTeacherProfile();

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user?.avatar_url) {
      setAvatarPreview(`http://localhost:5000${user.avatar_url}`);
    }
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        onError(t('teacher.profile.fileSizeError'));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone,
        address: formData.address,
        avatar: avatarFile || undefined
      });
      onSuccess(t('teacher.profile.updateSuccess'));
    } catch (err: any) {
      onError(err.response?.data?.message || err.response?.data?.error?.message || t('teacher.profile.updateError'));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left column: Avatar */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col items-center text-center transition duration-300">
          <div 
            className="relative w-40 h-40 rounded-full border border-gray-200 bg-gray-50 cursor-pointer overflow-hidden shadow-sm group mb-5 hover:shadow-md transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 group-hover:text-indigo-500 transition-colors">
                <Camera className="w-10 h-10 mb-2" />
                <span className="font-semibold text-xs tracking-wider uppercase">{t('teacher.profile.selectAvatar')}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-gray-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Upload className="w-8 h-8 text-white mb-1.5" />
              <span className="font-medium text-white text-xs">{t('teacher.profile.changeAvatar')}</span>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/jpeg, image/png, image/webp"
            className="hidden" 
          />

          <h2 className="text-xl font-bold text-gray-900">
            {formData.full_name || t('teacher.profile.noName')}
          </h2>
          <p className="text-sm text-gray-500 mt-1 mb-6">{user?.email}</p>

          <button 
            type="button" 
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl transition-colors font-medium text-sm shadow-sm hover:shadow"
          >
            <KeyRound className="w-4 h-4" />
            {t('teacher.profile.changePasswordBtn')}
          </button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />

      {/* Right column: Form */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm transition duration-300">
          <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2.5 border-b border-gray-100 pb-4">
            <Briefcase className="w-5 h-5 text-indigo-500" /> {t('teacher.profile.basicInfoTitle')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="full_name" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('teacher.profile.fullNameLabel')} <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                placeholder={t('teacher.profile.fullNamePlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('teacher.profile.emailLabel')}</label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 text-sm flex items-center cursor-not-allowed">
                  <Mail className="w-4 h-4 mr-2.5 text-gray-400" />
                  {user?.email}
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('teacher.profile.phoneLabel')}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="w-4 h-4 text-gray-400" />
                  </div>
                  <input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                    placeholder={t('teacher.profile.phonePlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1.5">Địa chỉ hiện tại</label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                <textarea 
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                  placeholder="Nhập địa chỉ của bạn..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <button 
                type="submit" 
                disabled={isPending}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50 text-sm"
              >
                {isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {t('teacher.profile.updatingBtn')}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {t('teacher.profile.updateBtn')}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
