import React, { useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle2 } from 'lucide-react';
import { useGenerateAiQuestions, useBulkCreateQuestions } from '../hooks/useTeacherTopicDetail';
import { Select } from '@/components/ui/Select';
import type { AiGeneratedQuestion } from '../types';
import { toast } from '@/utils/toast';

interface GenerateAiQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
}

const QUESTION_TYPE_OPTIONS = [
  { label: 'Trắc nghiệm nhiều lựa chọn', value: 'multiple_choice' },
  { label: 'Đúng / Sai', value: 'true_false' },
  { label: 'Hỗn hợp', value: 'mixed' },
];

const DIFFICULTY_OPTIONS = [
  { label: '1 sao (Rất dễ)', value: '1' },
  { label: '2 sao (Dễ)', value: '2' },
  { label: '3 sao (Trung bình)', value: '3' },
  { label: '4 sao (Khó)', value: '4' },
  { label: '5 sao (Rất khó)', value: '5' },
  { label: 'Ngẫu nhiên', value: 'random' },
];

export const GenerateAiQuestionsModal: React.FC<GenerateAiQuestionsModalProps> = ({
  isOpen,
  onClose,
  topicId,
  topicName,
}) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [topic, setTopic] = useState(topicName || '');
  const [questionType, setQuestionType] = useState('multiple_choice');
  const [quantity, setQuantity] = useState(10);
  const [difficulty, setDifficulty] = useState('3');
  
  const [generatedQuestions, setGeneratedQuestions] = useState<AiGeneratedQuestion[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  
  const { mutateAsync: generateQuestions, isPending: isGenerating } = useGenerateAiQuestions();
  const { mutateAsync: bulkCreate, isPending: isSaving } = useBulkCreateQuestions();

  if (!isOpen) return null;

  const handleClose = () => {
    setStep(1);
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    onClose();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const result = await generateQuestions({
        topic,
        question_type: questionType as any,
        quantity,
        difficulty: difficulty === 'random' ? undefined : Number(difficulty),
      });
      setGeneratedQuestions(result);
      setSelectedIndices(result.map((_, i) => i));
      setStep(2);
      toast.success('Tạo câu hỏi bằng AI thành công');
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi tạo câu hỏi bằng AI');
    }
  };

  const handleSave = async () => {
    try {
      const questionsToSave = generatedQuestions.filter((_, idx) => selectedIndices.includes(idx));
      if (questionsToSave.length === 0) return;

      await bulkCreate({
        topic_id: topicId,
        questions: questionsToSave,
      });
      toast.success(`Đã lưu thành công ${questionsToSave.length} câu hỏi`);
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || 'Có lỗi xảy ra khi lưu câu hỏi');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col ${step === 2 ? 'max-h-[90vh] overflow-hidden' : ''}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? 'Tạo câu hỏi bằng AI' : 'Duyệt câu hỏi đã tạo'}
            </h2>
          </div>
          <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className={`p-6 flex-1 bg-gray-50/50 ${step === 2 ? 'overflow-y-auto' : ''}`}>
          {step === 1 ? (
            <form id="generate-ai-form" onSubmit={handleGenerate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Chủ đề tạo câu hỏi</label>
                <input
                  type="text"
                  required
                  disabled
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Loại câu hỏi</label>
                  <Select
                    value={questionType}
                    onChange={setQuestionType}
                    options={QUESTION_TYPE_OPTIONS}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Số lượng</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">Tối đa 20 câu mỗi lần tạo.</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Độ khó</label>
                <Select
                  value={difficulty}
                  onChange={setDifficulty}
                  options={DIFFICULTY_OPTIONS}
                  className="w-full"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-6">
              {generatedQuestions.map((q, idx) => (
                <div key={idx} className={`bg-white border rounded-xl p-5 shadow-sm transition-colors ${selectedIndices.includes(idx) ? 'border-indigo-300 ring-1 ring-indigo-300' : 'border-gray-200'}`}>
                  <div className="flex items-start gap-3 mb-4">
                    <div className="pt-1.5 flex-shrink-0 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedIndices.includes(idx)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIndices(prev => [...prev, idx]);
                          } else {
                            setSelectedIndices(prev => prev.filter(i => i !== idx));
                          }
                        }}
                        className="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                      />
                    </div>
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-indigo-100 text-indigo-700 font-bold rounded-lg text-sm">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">{q.content}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                          {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' : 'Đúng/Sai'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                          Độ khó: {q.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pl-14 space-y-2">
                    {q.answer_options.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-3 rounded-lg border text-sm ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          <span>{String.fromCharCode(65 + oIdx)}. {opt.content}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {q.explanation && (
                    <div className="pl-14 mt-4">
                      <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                        <span className="font-semibold mr-1">Giải thích:</span>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`p-6 border-t border-gray-100 bg-white flex justify-end gap-3 ${step === 1 ? 'rounded-b-xl' : ''}`}>
          <button
            type="button"
            onClick={handleClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-4 focus:outline-none focus:ring-gray-100 transition-colors"
          >
            Hủy
          </button>
          {step === 1 ? (
            <button
              type="submit"
              form="generate-ai-form"
              disabled={isGenerating}
              className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Tạo câu hỏi
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving || selectedIndices.length === 0}
              className="flex items-center px-5 py-2.5 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 focus:ring-4 focus:outline-none focus:ring-indigo-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                `Lưu ${selectedIndices.length > 0 ? selectedIndices.length : ''} câu hỏi này`
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
