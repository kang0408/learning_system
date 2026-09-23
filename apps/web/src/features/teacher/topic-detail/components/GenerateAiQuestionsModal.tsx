import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, ArrowRight, Save, ArrowLeft, Layers, CheckSquare, Square, FileText, Upload, Quote, FileCheck } from 'lucide-react';
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
  const [sourceMode, setSourceMode] = useState<'document' | 'prompt'>('document');
  const [file, setFile] = useState<File | null>(null);
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
    setFile(null);
    setGeneratedQuestions([]);
    setSelectedIndices([]);
    onClose();
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sourceMode === 'document' && !file) {
      toast.error(t('teacher.topicDetail.aiModalFileRequired'));
      return;
    }

    try {
      const result = await generateQuestions({
        topic,
        question_type: questionType as any,
        quantity,
        difficulty: difficulty === 'random' ? undefined : Number(difficulty),
        file: sourceMode === 'document' && file ? file : undefined,
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
      <div className={`bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-3xl flex flex-col animate-in zoom-in-95 duration-200 ${step === 2 ? 'max-h-[90vh] overflow-hidden' : 'overflow-visible'}`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-slate-100 bg-white shrink-0 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0 shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                {step === 1 ? t('teacher.topicDetail.aiModalTitle1') : t('teacher.topicDetail.aiModalTitle2')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {step === 1
                  ? t('teacher.topicDetail.aiModalSubtitle1')
                  : t('teacher.topicDetail.aiModalSubtitle2', { count: generatedQuestions.length })}
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
        <div className={`p-5 sm:p-6 flex-1 bg-slate-50/50 ${step === 2 ? 'overflow-y-auto' : 'overflow-visible'}`}>
          {step === 1 ? (
            <form id="generate-ai-form" onSubmit={handleGenerate} className="space-y-5">
              {/* Nguồn tạo câu hỏi: Tài liệu vs Prompt */}
              <div className="flex rounded-xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setSourceMode('document')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    sourceMode === 'document'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  {t('teacher.topicDetail.aiModalTabDocument')}
                </button>
                <button
                  type="button"
                  onClick={() => setSourceMode('prompt')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                    sourceMode === 'prompt'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Sparkles className="w-4 h-4" />
                  {t('teacher.topicDetail.aiModalTabPrompt')}
                </button>
              </div>

              {/* Upload tài liệu khi ở chế độ Document */}
              {sourceMode === 'document' && (
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    {t('teacher.topicDetail.aiModalUploadLabel')} <span className="text-red-500">*</span>
                  </label>
                  {!file ? (
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 hover:bg-indigo-50/70 p-6 rounded-2xl cursor-pointer transition-all group">
                      <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
                        <Upload className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-slate-800 text-center">
                        {t('teacher.topicDetail.aiModalDropzoneTitle')}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {t('teacher.topicDetail.aiModalDropzoneHint')}
                      </p>
                      <input
                        type="file"
                        accept=".pdf,.docx,.txt,.md"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) {
                            setFile(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <div className="w-10 h-10 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                          <FileCheck className="w-5 h-5" />
                        </div>
                        <div className="overflow-hidden">
                          <p className="text-sm font-bold text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-indigo-600 font-medium">
                            {(file.size / (1024 * 1024)).toFixed(2)} MB • {t('teacher.topicDetail.aiModalReadyToAnalyze')}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setFile(null)}
                        className="text-xs text-slate-500 hover:text-red-600"
                      >
                        {t('teacher.topicDetail.aiModalChangeFile')}
                      </Button>
                    </div>
                  )}
                </div>
              )}

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
                  placeholder={t('teacher.topicDetail.aiModalTopicPlaceholder')}
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
                    {t('teacher.topicDetail.aiModalSelectedCount', {
                      selected: selectedIndices.length,
                      total: generatedQuestions.length,
                    })}
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
                      <Square className="w-3.5 h-3.5 mr-1.5" /> {t('teacher.topicDetail.aiModalDeselectAll')}
                    </>
                  ) : (
                    <>
                      <CheckSquare className="w-3.5 h-3.5 mr-1.5" /> {t('teacher.topicDetail.aiModalSelectAll')}
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
                              {t('teacher.topicDetail.aiModalDiffText')} {q.difficulty}/5
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
                      
                      {/* Evidence quote from document */}
                      {q.evidence_quote && (
                        <div className="pl-10 sm:pl-12 mt-2.5">
                          <div className="p-2.5 bg-amber-50/80 text-amber-950 text-xs rounded-xl border border-amber-200 flex items-start gap-2 leading-relaxed">
                            <Quote className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-bold">{t('teacher.topicDetail.aiModalEvidenceLabel')} </span>
                              <span className="italic">&ldquo;{q.evidence_quote}&rdquo;</span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {q.explanation && (
                        <div className="pl-10 sm:pl-12 mt-2">
                          <div className="p-3 bg-indigo-50/70 text-indigo-900 text-xs rounded-xl border border-indigo-100 leading-relaxed font-medium">
                            <span className="font-bold mr-1">💡 {t('teacher.topicDetail.listExplanation')}</span>
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
        <div className={`p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0 ${step === 1 ? 'rounded-b-2xl' : ''}`}>
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
                <ArrowLeft className="w-4 h-4 mr-1.5" /> {t('teacher.topicDetail.aiModalBackToConfig')}
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
                {isGenerating
                  ? t('teacher.topicDetail.aiModalBtnGenerating')
                  : t('teacher.topicDetail.aiModalBtnGenerate')}
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
