import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, Save, Mail, Phone, MapPin, Briefcase, KeyRound } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUpdateTeacherProfile } from '../hooks/useTeacherProfile';
import { ChangePasswordModal } from './ChangePasswordModal';
import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

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
      setAvatarPreview(`${import.meta.env.VITE_API_URL}${user.avatar_url}`);
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
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col items-center text-center">
          <div 
            className="relative w-40 h-40 rounded-full border border-gray-200 bg-slate-50 cursor-pointer overflow-hidden shadow-sm group mb-5 hover:shadow-md transition-all"
            onClick={() => fileInputRef.current?.click()}
          >
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-indigo-600 transition-colors">
                <Camera className="w-10 h-10 mb-2" />
                <span className="font-bold text-xs tracking-wider uppercase">{t('teacher.profile.selectAvatar')}</span>
              </div>
            )}

            <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <Upload className="w-8 h-8 text-white mb-1.5" />
              <span className="font-semibold text-white text-xs">{t('teacher.profile.changeAvatar')}</span>
            </div>
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/jpeg, image/png, image/webp"
            className="hidden" 
          />

          <h2 className="text-xl font-bold text-slate-900">
            {formData.full_name || t('teacher.profile.noName')}
          </h2>
          <p className="text-sm text-slate-500 mt-1 mb-6 font-medium">{user?.email}</p>

          <Button 
            type="button" 
            variant="outline"
            onClick={() => setIsChangePasswordOpen(true)}
            className="w-full"
          >
            <KeyRound className="w-4 h-4 mr-2" />
            {t('teacher.profile.changePasswordBtn')}
          </Button>
        </div>
      </div>

      <ChangePasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
      />

      {/* Right column: Form */}
      <div className="lg:col-span-2">
        <div className="bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <Briefcase className="w-5 h-5 text-indigo-600" /> {t('teacher.profile.basicInfoTitle')}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="full_name" required>{t('teacher.profile.fullNameLabel')}</Label>
              <Input 
                type="text" 
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder={t('teacher.profile.fullNamePlaceholder')}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <Label>{t('teacher.profile.emailLabel')}</Label>
                <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm font-medium flex items-center cursor-not-allowed">
                  <Mail className="w-4 h-4 mr-2.5 text-slate-400" />
                  {user?.email}
                </div>
              </div>

              <div>
                <Label htmlFor="phone">{t('teacher.profile.phoneLabel')}</Label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 flex items-center pointer-events-none" />
                  <Input 
                    type="tel" 
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-10"
                    placeholder={t('teacher.profile.phonePlaceholder')}
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Địa chỉ hiện tại</Label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                <Textarea 
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className="pl-10"
                  placeholder="Nhập địa chỉ của bạn..."
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 flex justify-end">
              <Button 
                type="submit" 
                variant="primary"
                isLoading={isPending}
              >
                <Save className="w-4 h-4 mr-2" />
                {t('teacher.profile.updateBtn')}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

