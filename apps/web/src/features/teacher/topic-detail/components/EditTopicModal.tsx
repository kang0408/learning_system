import React, { useState, useEffect } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { useUpdateTopic } from '../hooks/useTeacherTopicDetail';
import type { Topic } from '../types';

interface EditTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic;
}

export const EditTopicModal: React.FC<EditTopicModalProps> = ({ isOpen, onClose, topic }) => {
  const { mutateAsync: updateTopic, isPending } = useUpdateTopic();
  
  const [editTopicName, setEditTopicName] = useState('');
  const [editTopicDescription, setEditTopicDescription] = useState('');
  const [editTopicCode, setEditTopicCode] = useState('');
  const [enableEditCustomCode, setEnableEditCustomCode] = useState(false);

  useEffect(() => {
    if (isOpen && topic) {
      setEditTopicName(topic.name || '');
      setEditTopicDescription(topic.description || '');
      setEditTopicCode(topic.code || '');
      setEnableEditCustomCode(false);
    }
  }, [isOpen, topic]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTopicName.trim()) return;
    
    if (enableEditCustomCode && editTopicCode.trim().length !== 6) {
      alert('Mã chủ đề (nếu bật) phải có đúng 6 ký tự.');
      return;
    }

    try {
      const payload: any = {
        name: editTopicName,
        description: editTopicDescription
      };
      if (enableEditCustomCode) {
        payload.code = editTopicCode.trim().toUpperCase();
      }
      
      await updateTopic({ topicId: topic.id, payload });
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || err.response?.data?.error?.message || 'Không thể cập nhật chủ đề');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-lg w-full rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Sửa Chủ Đề</h2>
            <p className="text-sm text-gray-500 mt-1">Cập nhật thông tin cơ bản cho chủ đề này.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Tên chủ đề <span className="text-red-500">*</span></label>
            <input
              type="text"
              value={editTopicName}
              onChange={(e) => setEditTopicName(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
              placeholder="Ví dụ: Bài tập Unit 1"
              required
            />
          </div>
          
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-gray-700">Mô tả</label>
            <textarea
              value={editTopicDescription}
              onChange={(e) => setEditTopicDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
              rows={3}
              placeholder="Mô tả chi tiết về chủ đề này (không bắt buộc)"
            />
          </div>

          <div className="bg-gray-50/50 p-4 rounded-xl border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <div>
                <label className="block text-sm font-semibold text-gray-700">Chỉnh sửa Mã Chủ đề (Code)</label>
                <p className="text-xs text-gray-500 mt-0.5">Chỉ bật nếu bạn thực sự cần thay đổi mã.</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={enableEditCustomCode}
                  onChange={(e) => setEnableEditCustomCode(e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>
            
            <input
              type="text"
              maxLength={6}
              value={editTopicCode}
              onChange={(e) => setEditTopicCode(e.target.value.toUpperCase())}
              disabled={!enableEditCustomCode}
              className={`w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium uppercase tracking-[0.2em] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all ${!enableEditCustomCode ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white focus:bg-white'}`}
              placeholder="MÃ 6 KÝ TỰ"
            />
          </div>

          <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center transition-colors text-sm shadow-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
