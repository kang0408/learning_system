import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Save, ArrowLeft, Layers, CheckSquare, Square } from 'lucide-react';
import { useGenerateAiQuestions, useBulkCreateQuestions } from '../hooks/useTeacherTopicDetail';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Checkbox } from '@/components/ui/Checkbox';
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
    { label: t('teacher.topicDetail.aiModalTypeMultipleChoice'), value: 'multiple_choice' },
    { label: t('teacher.topicDetail.aiModalTypeMultiSelect'), value: 'multi_select' },
    { label: t('teacher.topicDetail.aiModalTypeTrueFalse'), value: 'true_false' },
    { label: t('teacher.topicDetail.aiModalTypeFillBlank'), value: 'fill_blank' },
    { label: t('teacher.topicDetail.aiModalTypeMatching'), value: 'matching' },
    { label: t('teacher.topicDetail.aiModalTypeMixed'), value: 'mixed' },
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
  const [questionType, setQuestionType] = useState('mixed');
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

  const toggleSelectAll = () => {
    if (selectedIndices.length === generatedQuestions.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(generatedQuestions.map((_, i) => i));
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return t('teacher.topicDetail.aiModalTypeMultipleChoice');
      case 'multi_select':
        return t('teacher.topicDetail.aiModalTypeMultiSelect');
      case 'true_false':
        return t('teacher.topicDetail.aiModalTypeTrueFalse');
      case 'fill_blank':
        return t('teacher.topicDetail.aiModalTypeFillBlank');
      case 'matching':
        return t('teacher.topicDetail.aiModalTypeMatching');
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 ${step === 2 ? 'max-h-[90vh]' : ''}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {step === 1 ? t('teacher.topicDetail.aiModalTitle1') : t('teacher.topicDetail.aiModalTitle2')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {step === 1 ? 'Cấu hình yêu cầu để AI tự động tạo ngân hàng câu hỏi' : `Đã tạo thành công ${generatedQuestions.length} câu hỏi theo chủ đề`}
              </p>
            </div>
          </div>
          <button 
            onClick={handleClose} 
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className={`p-5 sm:p-6 flex-1 bg-slate-50/50 ${step === 2 ? 'overflow-y-auto' : ''}`}>
          {step === 1 ? (
            <form id="generate-ai-form" onSubmit={handleGenerate} className="space-y-5">
              {/* Chủ đề */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('teacher.topicDetail.aiModalTopicLabel')} <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Ví dụ: Câu điều kiện loại 2, Từ vựng chuyên ngành IT..."
                />
              </div>
              
              {/* Loại câu hỏi & Số lượng */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('teacher.topicDetail.aiModalTypeLabel')}
                  </label>
                  <Select
                    value={questionType}
                    onChange={setQuestionType}
                    options={QUESTION_TYPE_OPTIONS}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('teacher.topicDetail.aiModalQuantityLabel')}
                  </label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    required
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                  <p className="text-xs text-slate-500 font-medium mt-1.5">{t('teacher.topicDetail.aiModalQuantityHint')}</p>
                </div>
              </div>

              {/* Độ khó */}
              <div>
                <label className="block text-sm font-bold text-slate-800 mb-1.5">
                  {t('teacher.topicDetail.aiModalDiffLabel')}
                </label>
                <Select
                  value={difficulty}
                  onChange={setDifficulty}
                  options={DIFFICULTY_OPTIONS}
                  className="w-full"
                />
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Selection summary & Toggle all */}
              <div className="flex items-center justify-between p-3.5 bg-white border border-slate-200 rounded-xl shadow-sm">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-bold text-slate-800">
                    Đã chọn <span className="text-indigo-600">{selectedIndices.length}</span> / {generatedQuestions.length} câu hỏi
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSelectAll}
                  className="text-xs h-8 text-indigo-600 hover:text-indigo-700"
                >
                  {selectedIndices.length === generatedQuestions.length ? (
                    <>
                      <Square className="w-3.5 h-3.5 mr-1.5" /> Bỏ chọn tất cả
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> Chọn tất cả
                    </>
                  )}
                </Button>
              </div>

              {/* List of generated questions */}
              <div className="space-y-4">
                {generatedQuestions.map((q, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div 
                      key={idx} 
                      className={`bg-white border rounded-xl p-4 sm:p-5 shadow-sm transition-all duration-200 ${
                        isSelected ? 'border-indigo-400 ring-2 ring-indigo-500/15 shadow-md' : 'border-slate-200 opacity-80'
                      }`}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="pt-0.5 shrink-0">
                          <Checkbox
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIndices(prev => [...prev, idx]);
                              } else {
                                setSelectedIndices(prev => prev.filter(i => i !== idx));
                              }
                            }}
                          />
                        </div>
                        <span className="shrink-0 w-7 h-7 flex items-center justify-center bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold rounded-lg text-xs">
                          {idx + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-900 font-bold text-sm sm:text-base leading-snug break-words">
                            {q.content}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <Badge variant="indigo" size="sm">
                              {getQuestionTypeLabel(q.question_type)}
                            </Badge>
                            <Badge variant="secondary" size="sm">
                              {t('teacher.topicDetail.aiModalDiffText')}: {q.difficulty}/5
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      {/* Answer Options */}
                      <div className="pl-10 sm:pl-12 space-y-2">
                        {q.answer_options?.map((opt, oIdx) => (
                          <div 
                            key={oIdx} 
                            className={`p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                              opt.is_correct 
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-semibold' 
                                : 'bg-slate-50/70 border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              {opt.is_correct && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                              <span>
                                {!['multi_select', 'fill_blank'].includes(q.question_type) && (
                                  <span className="font-bold mr-1">{String.fromCharCode(65 + oIdx)}.</span>
                                )}
                                {opt.content}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Matching pairs */}
                        {q.metadata?.pairs?.map((pair: any, pIdx: number) => (
                          <div key={pIdx} className="p-3 rounded-xl border text-xs sm:text-sm bg-slate-50 border-slate-200 text-slate-700">
                             <div className="flex items-center justify-between gap-3">
                                <div className="flex-1 bg-white p-2 rounded-lg border border-slate-200 text-center font-bold shadow-xs break-words">{pair.leftText}</div>
                                <ArrowRight className="w-4 h-4 text-indigo-500 shrink-0" />
                                <div className="flex-1 bg-white p-2 rounded-lg border border-slate-200 text-center font-bold shadow-xs break-words">{pair.rightText}</div>
                             </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Explanation */}
                      {q.explanation && (
                        <div className="pl-10 sm:pl-12 mt-3">
                          <div className="p-3 bg-indigo-50/70 text-indigo-900 text-xs rounded-xl border border-indigo-100 leading-relaxed font-medium">
                            <span className="font-bold mr-1">💡 {t('teacher.topicDetail.listExplanation')}:</span>
                            {q.explanation}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div>
            {step === 2 && (
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setStep(1)}
                disabled={isSaving}
                className="text-xs sm:text-sm text-slate-600"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Tạo lại cấu hình
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleClose}
              disabled={isGenerating || isSaving}
            >
              {t('teacher.topicDetail.aiModalBtnCancel')}
            </Button>

            {step === 1 ? (
              <Button
                type="submit"
                form="generate-ai-form"
                variant="primary"
                size="md"
                isLoading={isGenerating}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {t('teacher.topicDetail.aiModalBtnGenerate')}
              </Button>
            ) : (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleSave}
                isLoading={isSaving}
                disabled={selectedIndices.length === 0}
              >
                <Save className="w-4 h-4 mr-2" />
                {selectedIndices.length > 0 
                  ? t('teacher.topicDetail.aiModalBtnSave', { count: selectedIndices.length }) 
                  : t('teacher.topicDetail.aiModalBtnSaveSimple')}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
