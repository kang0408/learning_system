import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Upload, Camera, Save, X, Loader2, Award, Briefcase, Mail, Phone, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../../api/axios';

export default function TeacherProfile() {
  const { user, token, login } = useAuthStore();
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  
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
        setMessage({ type: 'error', text: 'Kích thước ảnh phải nhỏ hơn 5MB' });
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

      const res = await api.patch('/api/users/me', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        // Update global user state
        login(token!, res.data.data);
        setMessage({ type: 'success', text: 'Cập nhật thông tin thành công.' });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || err.response?.data?.error?.message || 'Có lỗi xảy ra khi cập nhật.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition duration-300">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900">Hồ sơ giáo viên</h1>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-900 text-xs font-semibold rounded-full border border-slate-200 flex items-center gap-1">
              <Award className="w-3.5 h-3.5" /> Giáo viên
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Quản lý thông tin cá nhân và thông tin liên hệ của bạn.</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 shadow-sm ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mt-0.5" /> : <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />}
          <div className="flex-1 font-medium">{message.text}</div>
          <button type="button" onClick={() => setMessage(null)} className="text-gray-400 hover:text-gray-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Avatar */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <div 
              className="relative w-40 h-40 rounded-full border-4 border-slate-50 bg-slate-100 cursor-pointer overflow-hidden shadow-md group mb-5"
              onClick={() => fileInputRef.current?.click()}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <Camera className="w-10 h-10 mb-2" />
                  <span className="text-xs font-bold uppercase tracking-wider">Chọn ảnh</span>
                </div>
              )}

              <div className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Upload className="w-8 h-8 text-white mb-2" />
                <span className="font-bold text-white uppercase tracking-wider text-xs">Thay đổi</span>
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
              {formData.full_name || 'Chưa cập nhật tên'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          </div>
        </div>

        {/* Right column: Form */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-slate-700" /> Thông tin cơ bản
            </h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div>
                <label htmlFor="full_name" className="block text-sm font-bold text-gray-700 mb-2">Họ và Tên *</label>
                <input 
                  type="text" 
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                  placeholder="Nhập họ và tên đầy đủ..."
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Email (Cố định)</label>
                  <div className="w-full px-4 py-3 border border-gray-200 bg-gray-100 text-gray-500 rounded-xl font-medium flex items-center cursor-not-allowed">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {user?.email}
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-bold text-gray-700 mb-2">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                    <input 
                      type="tel" 
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                      placeholder="0912 345 678"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-bold text-gray-700 mb-2">Địa chỉ hiện tại</label>
                <div className="relative">
                  <MapPin className="w-5 h-5 absolute left-4 top-3.5 text-gray-400" />
                  <textarea 
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 bg-gray-50 focus:bg-white rounded-xl focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-colors"
                    placeholder="Nhập địa chỉ của bạn..."
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="flex items-center justify-center px-8 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition duration-300 shadow-sm border border-slate-900 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="w-5 h-5 mr-2" />
                      Lưu thay đổi
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
