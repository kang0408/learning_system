import React from 'react';
import { useTranslation } from 'react-i18next';
import { X, Loader2, ArrowRight } from 'lucide-react';
import type { UpdateProfilePayload } from '../types';

interface ProfileFormProps {
  formData: UpdateProfilePayload;
  message: { type: 'success' | 'error', text: string } | null;
  isSubmitting: boolean;
  onClearMessage: () => void;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
}

export const ProfileForm: React.FC<ProfileFormProps> = ({ 
  formData, 
  message, 
  isSubmitting, 
  onClearMessage, 
  onChange 
}) => {
  const { t } = useTranslation();

  return (
    <div className="md:col-span-8 flex flex-col gap-8">
      {message && (
        <div className={`p-4 border-2 font-bold flex items-center justify-between ${
          message.type === 'success'
            ? 'bg-green-50 text-green-900 border-green-900'
            : 'bg-red-50 text-red-900 border-red-900'
        }`}>
          <span>{message.text}</span>
          <button type="button" onClick={onClearMessage}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex flex-col gap-2">
          <label htmlFor="full_name" className="font-black uppercase tracking-widest text-sm text-zinc-900">
            {t('student.profile.fullName')}
          </label>
          <input
            type="text"
            id="full_name"
            name="full_name"
            value={formData.full_name}
            onChange={onChange}
            placeholder={t('student.profile.fullNamePlaceholder')}
            className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="phone" className="font-black uppercase tracking-widest text-sm text-zinc-900">
            {t('student.profile.phone')}
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={onChange}
            placeholder="+84 123 456 789"
            className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="address" className="font-black uppercase tracking-widest text-sm text-zinc-900">
            {t('student.profile.address')}
          </label>
          <textarea
            id="address"
            name="address"
            value={formData.address}
            onChange={onChange}
            placeholder={t('student.profile.addressPlaceholder')}
            rows={3}
            className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px] resize-none"
          />
        </div>
      </div>

      <div className="pt-6 border-t-4 border-zinc-900 mt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="group relative w-full inline-flex items-center justify-center gap-4 px-8 py-5 border-2 border-zinc-900 bg-indigo-600 text-white text-xl font-black uppercase tracking-widest disabled:opacity-70 transition-all hover:bg-indigo-700 shadow-[6px_6px_0px_0px_rgba(24,24,27,1)] hover:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] hover:translate-x-[4px] hover:translate-y-[4px] active:shadow-none active:translate-x-[6px] active:translate-y-[6px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              {t('student.profile.saving')}
            </>
          ) : (
            <>
              {t('student.profile.save')}
              <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
