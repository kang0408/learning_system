import React, { useRef, useState, useEffect } from 'react';
import { Camera, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface AvatarUploadProps {
  user: any;
  avatarFile: File | null;
  onFileChange: (file: File) => void;
  onError: (msg: string) => void;
}

export const AvatarUpload: React.FC<AvatarUploadProps> = ({ 
  user, 
  avatarFile, 
  onFileChange, 
  onError 
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    if (avatarFile) {
      const url = URL.createObjectURL(avatarFile);
      setAvatarPreview(url);
      return () => URL.revokeObjectURL(url);
    } else if (user?.avatar_url) {
      setAvatarPreview(`http://localhost:5000${user.avatar_url}`);
    }
  }, [user, avatarFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        onError(t('student.profile.fileSizeError'));
        return;
      }
      onFileChange(file);
    }
  };

  return (
    <div className="md:col-span-4 flex flex-col items-center gap-6">
      <div
        className="relative group cursor-pointer"
        onMouseEnter={() => setIsHoveringAvatar(true)}
        onMouseLeave={() => setIsHoveringAvatar(false)}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Morphing Background / Border */}
        <div className={`absolute inset-0 bg-indigo-200 transition-all duration-700 ease-out z-0
          ${isHoveringAvatar ? 'rounded-[30px] rotate-6 scale-105' : 'rounded-full rotate-0 scale-100'}
        `} />

        {/* The Avatar Image itself */}
        <div className="relative z-10 w-48 h-48 border-4 border-zinc-900 rounded-full overflow-hidden bg-white shadow-[8px_8px_0px_0px_rgba(24,24,27,1)] transition-transform duration-300 group-hover:-translate-y-2 group-hover:-translate-x-2">
          {avatarPreview ? (
            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-100 text-zinc-400">
              <Camera className="w-12 h-12 mb-2" />
              <span className="font-bold text-sm uppercase tracking-wider">
                {t('student.profile.noPhoto')}
              </span>
            </div>
          )}

          {/* Overlay on hover */}
          <div className={`absolute inset-0 bg-indigo-600/90 flex flex-col items-center justify-center text-white transition-opacity duration-300 ${isHoveringAvatar ? 'opacity-100' : 'opacity-0'}`}>
            <Upload className="w-10 h-10 mb-2 animate-bounce" />
            <span className="font-black uppercase tracking-widest text-sm">
              {t('student.profile.uploadMagic')}
            </span>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleChange}
        accept="image/jpeg, image/png, image/webp"
        className="hidden"
      />

      <div className="text-center space-y-1">
        <p className="font-bold text-zinc-900 uppercase tracking-wider">{user?.email}</p>
        <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-widest border-2 border-indigo-800 rounded-full">
          {user?.role === 'student' ? t('student.profile.studentRole') : user?.role}
        </span>
      </div>
    </div>
  );
};
