import React, { useState } from 'react';
import { X, Sparkles, Loader2, CheckCircle2, ArrowRight } from 'lucide-react';
import { useGenerateAiQuestions, useBulkCreateQuestions } from '../hooks/useTeacherTopicDetail';
import { Select } from '@/components/ui/Select';
import type { AiGeneratedQuestion } from '../types';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

interface GenerateAiQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  topicId: string;
  topicName: string;
}

export const GenerateAiQuestionsModal: React.FC<GenerateAiQuestionsModalProps> = ({
  isOpen,
  onClose,
  topicId,
  topicName,
}) => {
  const { t } = useTranslation();

  const QUESTION_TYPE_OPTIONS = [
    { label: 'Trắc nghiệm', value: 'multiple_choice' },
    { label: 'Nhiều lựa chọn', value: 'multi_select' },
    { label: 'Đúng / Sai', value: 'true_false' },
    { label: 'Điền vào chỗ trống', value: 'fill_blank' },
    { label: 'Ghép cặp', value: 'matching' },
    { label: 'Tổng hợp', value: 'mixed' },
  ];

  const DIFFICULTY_OPTIONS = [
    { label: t('teacher.topicDetail.aiModalDiff1'), value: '1' },
    { label: t('teacher.topicDetail.aiModalDiff2'), value: '2' },
    { label: t('teacher.topicDetail.aiModalDiff3'), value: '3' },
    { label: t('teacher.topicDetail.aiModalDiff4'), value: '4' },
    { label: t('teacher.topicDetail.aiModalDiff5'), value: '5' },
    { label: t('teacher.topicDetail.aiModalDiffRandom'), value: 'random' },
  ];

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
      toast.success(t('teacher.topicDetail.aiModalGenerateSuccess'));
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('teacher.topicDetail.aiModalGenerateError'));
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
      toast.success(t('teacher.topicDetail.aiModalSaveSuccess', { count: questionsToSave.length }));
      handleClose();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || t('teacher.topicDetail.aiModalSaveError'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
      <div className={`bg-white rounded-xl shadow-xl w-full max-w-3xl flex flex-col ${step === 2 ? 'max-h-[90vh] overflow-hidden' : ''}`}>
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 1 ? t('teacher.topicDetail.aiModalTitle1') : t('teacher.topicDetail.aiModalTitle2')}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('teacher.topicDetail.aiModalTopicLabel')}</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('teacher.topicDetail.aiModalTypeLabel')}</label>
                  <Select
                    value={questionType}
                    onChange={setQuestionType}
                    options={QUESTION_TYPE_OPTIONS}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('teacher.topicDetail.aiModalQuantityLabel')}</label>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-full px-4 py-3.5 bg-white border border-gray-300 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-2">{t('teacher.topicDetail.aiModalQuantityHint')}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{t('teacher.topicDetail.aiModalDiffLabel')}</label>
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
                          {q.question_type === 'multiple_choice' ? 'Trắc nghiệm' 
                           : q.question_type === 'multi_select' ? 'Nhiều lựa chọn'
                           : q.question_type === 'true_false' ? 'Đúng / Sai'
                           : q.question_type === 'fill_blank' ? 'Điền vào chỗ trống' 
                           : 'Ghép cặp'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-md">
                          {t('teacher.topicDetail.aiModalDiffText')} {q.difficulty}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pl-14 space-y-2">
                    {q.answer_options?.map((opt, oIdx) => (
                      <div key={oIdx} className={`p-3 rounded-lg border text-sm ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-800' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                        <div className="flex items-center gap-2">
                          {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                          <span>{!['multi_select', 'fill_blank'].includes(q.question_type) && `${String.fromCharCode(65 + oIdx)}. `}{opt.content}</span>
                        </div>
                      </div>
                    ))}
                    {q.metadata?.pairs?.map((pair: any, pIdx: number) => (
                      <div key={pIdx} className="p-3 rounded-lg border text-sm bg-gray-50 border-gray-200 text-gray-700">
                         <div className="flex items-center justify-between gap-4">
                            <div className="flex-1 bg-white p-2.5 rounded-md border border-gray-200 text-center font-medium shadow-sm break-words">{pair.leftText}</div>
                            <ArrowRight className="w-5 h-5 text-indigo-400 flex-shrink-0" />
                            <div className="flex-1 bg-white p-2.5 rounded-md border border-gray-200 text-center font-medium shadow-sm break-words">{pair.rightText}</div>
                         </div>
                      </div>
                    ))}
                  </div>
                  
                  {q.explanation && (
                    <div className="pl-14 mt-4">
                      <div className="p-3 bg-blue-50 text-blue-800 text-sm rounded-lg border border-blue-100">
                        <span className="font-semibold mr-1">{t('teacher.topicDetail.listExplanation')}</span>
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
            {t('teacher.topicDetail.aiModalBtnCancel')}
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
                  {t('teacher.topicDetail.aiModalBtnGenerating')}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  {t('teacher.topicDetail.aiModalBtnGenerate')}
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
                  {t('teacher.topicDetail.aiModalBtnSaving')}
                </>
              ) : (
                selectedIndices.length > 0 ? t('teacher.topicDetail.aiModalBtnSave', { count: selectedIndices.length }) : t('teacher.topicDetail.aiModalBtnSaveSimple')
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
