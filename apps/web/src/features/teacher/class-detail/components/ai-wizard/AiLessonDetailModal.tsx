import React, { useState } from 'react';
import {
  X,
  Layers,
  FileQuestion,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AiEvidenceQuoteBox } from './AiEvidenceQuoteBox';
import type {
  WizardLesson,
  WizardTopic,
  WizardQuestion,
  QuestionType,
} from '../../types/aiWizard.types';

interface AiLessonDetailModalProps {
  lesson: WizardLesson;
  topics: WizardTopic[];
  questions: WizardQuestion[];
  onClose: () => void;
  onSave: (topics: WizardTopic[], questions: WizardQuestion[]) => Promise<void>;
  onRegenerateQuestion: (
    lessonTempId: string,
    questionTempId: string,
    instruction?: string
  ) => Promise<WizardQuestion>;
}

export const AiLessonDetailModal: React.FC<AiLessonDetailModalProps> = ({
  lesson,
  topics: initialTopics,
  questions: initialQuestions,
  onClose,
  onSave,
  onRegenerateQuestion,
}) => {
  const [activeTab, setActiveTab] = useState<'questions' | 'topics'>('questions');
  const [topics, setTopics] = useState<WizardTopic[]>(initialTopics || []);
  const [questions, setQuestions] = useState<WizardQuestion[]>(initialQuestions || []);
  const [isSaving, setIsSaving] = useState(false);

  // Regeneration state
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [regenInstructionMap, setRegenInstructionMap] = useState<Record<string, string>>({});
  const [showRegenPromptId, setShowRegenPromptId] = useState<string | null>(null);

  // Add new topic state
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const [isAddingTopic, setIsAddingTopic] = useState(false);

  // Question editing helpers
  const handleUpdateQuestion = (tempId: string, updated: Partial<WizardQuestion>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.temp_id === tempId ? { ...q, ...updated } : q))
    );
  };

  const handleDeleteQuestion = (tempId: string) => {
    setQuestions((prev) => prev.filter((q) => q.temp_id !== tempId));
  };

  const handleToggleOptionCorrect = (questionTempId: string, optIndex: number) => {
    setQuestions((prev) =>
      prev.map((q) => {
        if (q.temp_id !== questionTempId) return q;
        const isSingleChoice = q.question_type === 'multiple_choice' || q.question_type === 'true_false';
        const updatedOpts = q.answer_options.map((opt, idx) => ({
          ...opt,
          is_correct: isSingleChoice ? idx === optIndex : idx === optIndex ? !opt.is_correct : opt.is_correct,
        }));
        return { ...q, answer_options: updatedOpts };
      })
    );
  };

  const handleTriggerRegenerate = async (questionTempId: string) => {
    setRegeneratingId(questionTempId);
    try {
      const instruction = regenInstructionMap[questionTempId];
      const newQ = await onRegenerateQuestion(lesson.temp_id, questionTempId, instruction);
      setQuestions((prev) =>
        prev.map((q) => (q.temp_id === questionTempId ? newQ : q))
      );
      setShowRegenPromptId(null);
    } catch (err) {
      console.error('Failed to regenerate question', err);
    } finally {
      setRegeneratingId(null);
    }
  };

  // Topic helpers
  const handleAddTopic = () => {
    if (!newTopicName.trim()) return;
    const created: WizardTopic = {
      temp_id: `top_${lesson.temp_id}_${Date.now()}`,
      name: newTopicName.trim(),
      description: newTopicDesc.trim(),
    };
    setTopics([...topics, created]);
    setNewTopicName('');
    setNewTopicDesc('');
    setIsAddingTopic(false);
  };

  const handleDeleteTopic = (tempId: string) => {
    setTopics((prev) => prev.filter((t) => t.temp_id !== tempId));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(topics, questions);
      onClose();
    } catch (err) {
      console.error('Failed to save lesson detail', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getQuestionTypeLabel = (type: QuestionType) => {
    switch (type) {
      case 'multiple_choice':
        return 'Trắc nghiệm 1 đáp án';
      case 'multi_select':
        return 'Trắc nghiệm nhiều đáp án';
      case 'true_false':
        return 'Đúng / Sai';
      case 'fill_blank':
        return 'Điền từ vào chỗ trống';
      case 'matching':
        return 'Nối cặp tương ứng';
      default:
        return type;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                Bài {lesson.order_index}
              </span>
              <h3 className="text-lg font-bold text-slate-900 truncate">{lesson.title}</h3>
            </div>
            {lesson.summary && (
              <p className="text-xs sm:text-sm text-slate-500 line-clamp-1">{lesson.summary}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-white shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'questions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileQuestion className="w-4 h-4" />
            Ngân Hàng Câu Hỏi ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'topics'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            Chủ Đề Kiến Thức ({topics.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: QUESTIONS LIST */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {questions.map((q, qIndex) => {
                const isRegenerating = regeneratingId === q.temp_id;
                const isShowPrompt = showRegenPromptId === q.temp_id;

                return (
                  <div
                    key={q.temp_id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 shadow-sm hover:border-slate-300 transition-all"
                  >
                    {/* Question Header & Badges */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          #{qIndex + 1}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {getQuestionTypeLabel(q.question_type)}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                          Độ khó: {q.difficulty}/5
                        </span>
                      </div>

                      {/* Top Right Action: Regenerate & Delete */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={isRegenerating}
                          onClick={() =>
                            setShowRegenPromptId(isShowPrompt ? null : q.temp_id)
                          }
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                        >
                          {isRegenerating ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <RefreshCw className="w-3.5 h-3.5" />
                          )}
                          <span>Sinh lại câu này</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.temp_id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Regeneration Prompt Popover */}
                    {isShowPrompt && (
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                        <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                          Yêu cầu chỉnh sửa khi sinh lại (Tùy chọn)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={regenInstructionMap[q.temp_id] || ''}
                            onChange={(e) =>
                              setRegenInstructionMap({
                                ...regenInstructionMap,
                                [q.temp_id]: e.target.value,
                              })
                            }
                            placeholder="Ví dụ: Tăng độ khó, đổi sang trắc nghiệm, tập trung vào thì hiện tại..."
                            className="flex-1 text-xs border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleTriggerRegenerate(q.temp_id)}
                            disabled={isRegenerating}
                            className="text-xs"
                          >
                            {isRegenerating ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              'Bắt đầu sinh lại'
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Question Content Input */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Nội dung câu hỏi
                      </label>
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) =>
                          handleUpdateQuestion(q.temp_id, { content: e.target.value })
                        }
                        className="w-full text-xs sm:text-sm font-semibold text-slate-900 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>

                    {/* Evidence Quote Box */}
                    <AiEvidenceQuoteBox quote={q.evidence_quote} />

                    {/* Answer Options / Matching Pairs */}
                    {q.question_type !== 'matching' ? (
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                          <span>Phương án trả lời (Chọn phương án đúng)</span>
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.answer_options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              onClick={() => handleToggleOptionCorrect(q.temp_id, optIdx)}
                              className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                                opt.is_correct
                                  ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 font-bold shadow-sm'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <div
                                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                  opt.is_correct
                                    ? 'bg-emerald-600 text-white'
                                    : 'border border-slate-300 text-slate-400'
                                }`}
                              >
                                {opt.is_correct ? (
                                  <Check className="w-3 h-3" />
                                ) : (
                                  String.fromCharCode(65 + optIdx)
                                )}
                              </div>
                              <input
                                type="text"
                                value={opt.content}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => {
                                  const updatedOpts = [...q.answer_options];
                                  updatedOpts[optIdx] = { ...opt, content: e.target.value };
                                  handleUpdateQuestion(q.temp_id, {
                                    answer_options: updatedOpts,
                                  });
                                }}
                                className="flex-1 bg-transparent border-none outline-none font-inherit"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Matching Question Pairs */
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Các cặp nối tương ứng
                        </label>
                        <div className="space-y-1.5">
                          {(q.metadata?.pairs || []).map((pair, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                            >
                              <span className="font-semibold text-slate-800 flex-1">
                                {pair.leftText}
                              </span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="font-semibold text-slate-800 flex-1">
                                {pair.rightText}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Explanation */}
                    {q.explanation && (
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                        <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider">
                          Giải thích đáp án:
                        </span>
                        <p>{q.explanation}</p>
                      </div>
                    )}
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div className="text-center py-8 text-slate-400 text-sm font-medium">
                  Chưa có câu hỏi nào trong bài này.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOPICS LIST */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-xs text-slate-500 font-medium">
                  Danh mục các chủ đề kiến thức được phân loại từ bài học.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAddingTopic(true)}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Thêm chủ đề
                </Button>
              </div>

              {isAddingTopic && (
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                  <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    Thêm Chủ Đề Mới
                  </h5>
                  <input
                    type="text"
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder="Tên chủ đề kiến thức (VD: Thì Hiện tại đơn)"
                    className="w-full text-xs font-semibold border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <textarea
                    rows={2}
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder="Mô tả tóm tắt nội dung chủ đề..."
                    className="w-full text-xs border border-slate-200 rounded-xl p-2.5 bg-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="primary" size="sm" onClick={handleAddTopic} className="text-xs">
                      Lưu chủ đề
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingTopic(false)}
                      className="text-xs"
                    >
                      Hủy
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2.5">
                {topics.map((topic, tIdx) => (
                  <div
                    key={topic.temp_id}
                    className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-100 text-slate-700 font-bold text-[11px] flex items-center justify-center">
                          {tIdx + 1}
                        </span>
                        <h5 className="text-sm font-bold text-slate-800 truncate">{topic.name}</h5>
                      </div>
                      {topic.description && (
                        <p className="text-xs text-slate-500 pl-7">{topic.description}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteTopic(topic.temp_id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            Đóng
          </Button>

          <Button
            variant="primary"
            size="md"
            onClick={handleSaveAll}
            disabled={isSaving}
            className="shadow-md shadow-indigo-100"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Lưu Thay Đổi
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
