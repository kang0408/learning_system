import React, { useState } from 'react';
import { Loader2, X } from 'lucide-react';

interface EditClassModalProps {
  onClose: () => void;
  onSubmit: (payload: { name: string; subject?: string; description?: string }) => Promise<void>;
  isUpdating: boolean;
  initialData: {
    name: string;
    subject: string;
    description: string;
  };
}

export const EditClassModal: React.FC<EditClassModalProps> = ({ onClose, onSubmit, isUpdating, initialData }) => {
  const [name, setName] = useState(initialData.name);
  const [subject, setSubject] = useState(initialData.subject || '');
  const [description, setDescription] = useState(initialData.description || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onSubmit({
      name,
      subject,
      description
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-2">Chỉnh sửa Lớp học</h2>
        <p className="text-sm text-gray-500 mb-6">Thay đổi thông tin lớp học của bạn.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tên lớp học <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="Ví dụ: Tiếng Anh giao tiếp K1"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Môn học</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="Ví dụ: Tiếng Anh"
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              disabled={isUpdating || !name.trim()}
              className="flex-[2] px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors shadow-sm text-sm"
            >
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Lưu thay đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
