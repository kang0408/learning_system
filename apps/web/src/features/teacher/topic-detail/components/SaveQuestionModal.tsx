import React, { useState, useEffect } from 'react';
import { Loader2, Save, Star, X } from 'lucide-react';
import { useSaveQuestion } from '../hooks/useTeacherTopicDetail';
import type { Topic, Question } from '../types';
import { toast } from '@/utils/toast';

interface SaveQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  initialTopicId?: string;
  editingQuestion?: Question | null;
}

export const SaveQuestionModal: React.FC<SaveQuestionModalProps> = ({ 
  isOpen, 
  onClose, 
  topics,
  initialTopicId,
  editingQuestion 
}) => {
  const { mutateAsync: saveQuestion, isPending } = useSaveQuestion();
  
  const [newType, setNewType] = useState('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectOption, setNewCorrectOption] = useState(0);
  const [isTrueStatement, setIsTrueStatement] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [newDifficulty, setNewDifficulty] = useState(3);
  const [newExplanation, setNewExplanation] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingQuestion) {
        setNewType(editingQuestion.question_type);
        setNewContent(editingQuestion.content);
        setNewExplanation(editingQuestion.explanation || '');
        setNewDifficulty(editingQuestion.difficulty);
        setSelectedTopicId(editingQuestion.topic_id || initialTopicId || '');
        
        if (editingQuestion.question_type === 'multiple_choice') {
          const opts = editingQuestion.answer_options || [];
          setNewOptions([
            opts[0]?.content || '',
            opts[1]?.content || '',
            opts[2]?.content || '',
            opts[3]?.content || ''
          ]);
          const correctIdx = opts.findIndex((o) => o.is_correct);
          setNewCorrectOption(correctIdx >= 0 ? correctIdx : 0);
        } else {
          const opts = editingQuestion.answer_options || [];
          const correctOpt = opts.find((o) => o.is_correct);
          setIsTrueStatement(correctOpt?.content === 'Đúng');
        }
      } else {
        setNewType('multiple_choice');
        setNewContent('');
        setNewExplanation('');
        setNewDifficulty(3);
        setSelectedTopicId(initialTopicId || topics[0]?.id || '');
        setNewOptions(['', '', '', '']);
        setNewCorrectOption(0);
        setIsTrueStatement(true);
      }
    }
  }, [isOpen, editingQuestion, initialTopicId, topics]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    let answer_options = [];
    if (newType === 'multiple_choice') {
      answer_options = newOptions.map((opt, index) => ({
        content: opt,
        is_correct: index === newCorrectOption,
        order_index: index
      }));
    } else {
      answer_options = [
        { content: 'Đúng', is_correct: isTrueStatement, order_index: 0 },
        { content: 'Sai', is_correct: !isTrueStatement, order_index: 1 }
      ];
    }

    try {
      await saveQuestion({
        questionId: editingQuestion?.id,
        payload: {
          topic_id: selectedTopicId || undefined,
          question_type: newType,
          content: newContent,
          difficulty: newDifficulty,
          explanation: newExplanation,
          answer_options
        }
      });
      
      toast.success(editingQuestion ? 'Cập nhật câu hỏi thành công' : 'Tạo câu hỏi thành công');
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu câu hỏi');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingQuestion ? 'Sửa Câu Hỏi' : 'Thêm Câu Hỏi Mới'}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Điền thông tin và đáp án cho câu hỏi của bạn.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Chọn Chủ đề <span className="text-red-500">*</span></label>
                <select
                  value={selectedTopicId}
                  onChange={(e) => setSelectedTopicId(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                >
                  {!topics.some(t => t.name === 'Chưa phân loại') && (
                    <option value="">Không phân loại (Tạo mới mặc định)</option>
                  )}
                  {topics.map(s => (
                    <option key={s.id} value={s.id}>{s.name} {s.code ? `(${s.code})` : ''}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">Loại câu hỏi</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
                >
                  <option value="multiple_choice">Trắc nghiệm (4 lựa chọn)</option>
                  <option value="true_false">Đúng / Sai</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Nội dung câu hỏi <span className="text-red-500">*</span></label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                rows={4}
                placeholder="Nhập nội dung câu hỏi..."
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Giải thích (Tùy chọn)</label>
              <textarea
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                rows={2}
                placeholder="Giải thích thêm cho câu trả lời..."
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">Độ khó (1-5 sao)</label>
              <div className="flex items-center gap-1 bg-gray-50 w-fit px-4 py-2.5 rounded-xl border border-gray-200">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewDifficulty(star)}
                    className={`p-1 transition-all duration-200 transform hover:scale-110 ${newDifficulty >= star ? 'text-amber-400' : 'text-gray-300 hover:text-amber-200'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
              {newType === 'multiple_choice' ? (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-4">Các đáp án (Chọn đáp án đúng)</label>
                  <div className="space-y-3">
                    {newOptions.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${newCorrectOption === i ? 'border-indigo-300 bg-white shadow-sm' : 'border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200'}`}>
                        <div className="flex-shrink-0">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={newCorrectOption === i}
                            onChange={() => setNewCorrectOption(i)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-grow px-3 py-2 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                          placeholder={`Nhập đáp án ${i + 1}`}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-4">Đáp án đúng là gì?</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsTrueStatement(true)}
                      className={`flex-1 py-3 px-5 rounded-xl border font-semibold transition-all ${isTrueStatement ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                      Đúng
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTrueStatement(false)}
                      className={`flex-1 py-3 px-5 rounded-xl border font-semibold transition-all ${!isTrueStatement ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                      Sai
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
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
              {editingQuestion ? 'Lưu Thay Đổi' : 'Lưu Câu Hỏi'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
