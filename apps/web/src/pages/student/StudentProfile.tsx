import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Upload, Camera, Save, ArrowRight, X, Loader2 } from 'lucide-react';

export default function StudentProfile() {
  const { user, token, login } = useAuthStore();
  const [isHoveringAvatar, setIsHoveringAvatar] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

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
        setMessage({ type: 'error', text: 'File size must be less than 5MB' });
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
      setMessage(null);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      const data = new FormData();
      if (formData.full_name) data.append('full_name', formData.full_name);
      if (formData.phone) data.append('phone', formData.phone);
      if (formData.address) data.append('address', formData.address);
      if (avatarFile) data.append('avatar', avatarFile);

      const res = await fetch('http://localhost:5000/api/users/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      const result = await res.json();
      if (result.success) {
        // Update global user state
        login(token!, result.data);
        setMessage({ type: 'success', text: 'Profile updated successfully.' });
      } else {
        setMessage({ type: 'error', text: result.error?.message || 'Failed to update profile.' });
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Network error occurred.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header section with Editorial Brutalist style */}
      <div className="flex flex-col gap-4 border-b-4 border-zinc-900 pb-8">
        <h1 className="text-6xl sm:text-7xl font-black tracking-tighter uppercase text-zinc-900">
          My Profile.
        </h1>
        <p className="text-xl font-bold tracking-tight text-zinc-500 uppercase">
          Keep your academic identity up to date
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-12">

        {/* Left Column: Avatar (The Differentiation Anchor) */}
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
                  <span className="font-bold text-sm uppercase tracking-wider">No Photo</span>
                </div>
              )}

              {/* Overlay on hover */}
              <div className={`absolute inset-0 bg-indigo-600/90 flex flex-col items-center justify-center text-white transition-opacity duration-300 ${isHoveringAvatar ? 'opacity-100' : 'opacity-0'}`}>
                <Upload className="w-10 h-10 mb-2 animate-bounce" />
                <span className="font-black uppercase tracking-widest text-sm">Upload Magic</span>
              </div>
            </div>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/jpeg, image/png, image/webp"
            className="hidden"
          />

          <div className="text-center space-y-1">
            <p className="font-bold text-zinc-900 uppercase tracking-wider">{user?.email}</p>
            <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-black uppercase tracking-widest border-2 border-indigo-800 rounded-full">
              {user?.role || 'Student'}
            </span>
          </div>
        </div>

        {/* Right Column: Form Inputs */}
        <div className="md:col-span-8 flex flex-col gap-8">

          {message && (
            <div className={`p-4 border-2 font-bold flex items-center justify-between ${message.type === 'success'
                ? 'bg-green-50 text-green-900 border-green-900'
                : 'bg-red-50 text-red-900 border-red-900'
              }`}>
              <span>{message.text}</span>
              <button type="button" onClick={() => setMessage(null)}><X className="w-5 h-5" /></button>
            </div>
          )}

          <div className="space-y-6">
            <div className="flex flex-col gap-2">
              <label htmlFor="full_name" className="font-black uppercase tracking-widest text-sm text-zinc-900">
                Full Name
              </label>
              <input
                type="text"
                id="full_name"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                placeholder="Enter your full name"
                className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="phone" className="font-black uppercase tracking-widest text-sm text-zinc-900">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+84 123 456 789"
                className="w-full px-5 py-4 bg-white border-2 border-zinc-900 text-lg font-bold placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-indigo-200 transition-all shadow-[4px_4px_0px_0px_rgba(24,24,27,1)] focus:shadow-[2px_2px_0px_0px_rgba(24,24,27,1)] focus:translate-x-[2px] focus:translate-y-[2px]"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="address" className="font-black uppercase tracking-widest text-sm text-zinc-900">
                Address
              </label>
              <textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Where do you study from?"
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
                  Saving...
                </>
              ) : (
                <>
                  Save Profile
                  <ArrowRight className="w-6 h-6 transition-transform group-hover:translate-x-2" />
                </>
              )}
            </button>
          </div>

        </div>
      </form>
    </div>
  );
}
