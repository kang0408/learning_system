import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { CreateClassPayload } from '../types';

interface CreateClassModalProps {
  onClose: () => void;
  onSubmit: (payload: CreateClassPayload) => Promise<void>;
  isCreating: boolean;
}

export const CreateClassModal: React.FC<CreateClassModalProps> = ({ onClose, onSubmit, isCreating }) => {
  const [newClassName, setNewClassName] = useState('');
  const [newClassSubject, setNewClassSubject] = useState('English');
  const [newClassDesc, setNewClassDesc] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    await onSubmit({
      name: newClassName,
      subject: newClassSubject,
      description: newClassDesc
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 relative">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Tạo Lớp học mới</h2>
        <p className="text-sm text-gray-500 mb-6">Điền thông tin cơ bản để khởi tạo lớp học của bạn.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tên lớp học <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newClassName}
              onChange={(e) => setNewClassName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="Ví dụ: Tiếng Anh giao tiếp K1"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Môn học <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={newClassSubject}
              onChange={(e) => setNewClassSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="Ví dụ: Tiếng Anh"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={newClassDesc}
              onChange={(e) => setNewClassDesc(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
              placeholder="Mô tả ngắn gọn về lớp học này (không bắt buộc)"
              rows={3}
            />
          </div>
          
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 hover:text-gray-900 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isCreating || !newClassName.trim()}
              className="flex-[2] px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm text-sm"
            >
              {isCreating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Khởi tạo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
