import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  X,
  Layers,
  FileQuestion,
  Plus,
  Trash2,
  Check,
  RefreshCw,
  Loader2,
  Sliders,
  Clock,
  RotateCcw,
  Calendar,
  Eye,
  EyeOff,
  BookOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
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
  onSave: (
    topics: WizardTopic[],
    questions: WizardQuestion[],
    lessonSettings?: Partial<WizardLesson>
  ) => Promise<void>;
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
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'questions' | 'topics' | 'settings'>('questions');
  const [topics, setTopics] = useState<WizardTopic[]>(initialTopics || []);
  const [questions, setQuestions] = useState<WizardQuestion[]>(initialQuestions || []);
  const [isSaving, setIsSaving] = useState(false);

  // Lesson & Assignment Settings
  const [assignmentMode, setAssignmentMode] = useState<'standard' | 'adaptive' | 'exam'>(
    lesson.assignment_mode || 'standard'
  );
  const [isCurriculumPublished, setIsCurriculumPublished] = useState<boolean>(
    lesson.is_curriculum_published ?? true
  );
  const [isAssignmentPublished, setIsAssignmentPublished] = useState<boolean>(
    lesson.is_assignment_published ?? true
  );
  const [deadline, setDeadline] = useState<string>(
    lesson.deadline ? lesson.deadline.substring(0, 16) : ''
  );
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>(
    lesson.time_limit_minutes ? String(lesson.time_limit_minutes) : ''
  );
  const [maxAttempts, setMaxAttempts] = useState<number>(lesson.max_attempts ?? 0);

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
    if (
      !window.confirm(
        t('teacher.aiWizard.detailModal.deleteQuestionConfirm', 'Bạn có chắc chắn muốn xóa câu hỏi này?')
      )
    ) {
      return;
    }
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
    const topicToDelete = topics.find((t) => t.temp_id === tempId);
    const confirmMessage = t(
      'teacher.aiWizard.detailModal.deleteTopicConfirm',
      `Bạn có chắc chắn muốn xóa chủ đề "${topicToDelete?.name || ''}" không? Các câu hỏi thuộc chủ đề này sẽ được chuyển sang chủ đề khác.`
    );
    if (!window.confirm(confirmMessage)) return;

    setTopics((prevTopics) => {
      const remaining = prevTopics.filter((t) => t.temp_id !== tempId);
      const fallbackTopicId = remaining[0]?.temp_id || '';
      setQuestions((prevQuestions) =>
        prevQuestions.map((q) =>
          q.topic_temp_id === tempId ? { ...q, topic_temp_id: fallbackTopicId } : q
        )
      );
      return remaining;
    });
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await onSave(topics, questions, {
        assignment_mode: assignmentMode,
        is_curriculum_published: isCurriculumPublished,
        is_assignment_published: isAssignmentPublished,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        time_limit_minutes: timeLimitMinutes ? Number(timeLimitMinutes) : null,
        max_attempts: Number(maxAttempts) || 0,
      });
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
        return t('teacher.aiWizard.detailModal.types.multiple_choice', 'Trắc nghiệm đơn');
      case 'multi_select':
        return t('teacher.aiWizard.detailModal.types.multi_select', 'Nhiều đáp án');
      case 'true_false':
        return t('teacher.aiWizard.detailModal.types.true_false', 'Đúng / Sai');
      case 'fill_blank':
        return t('teacher.aiWizard.detailModal.types.fill_blank', 'Điền khuyết');
      case 'matching':
        return t('teacher.aiWizard.detailModal.types.matching', 'Nối cặp từ');
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
                {t('teacher.aiWizard.detailModal.lessonBadge', { index: lesson.order_index, defaultValue: `Bài ${lesson.order_index}` })}
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
            {t('teacher.aiWizard.detailModal.tabQuestions', { count: questions.length, defaultValue: `Câu hỏi (${questions.length})` })}
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
            {t('teacher.aiWizard.detailModal.tabTopics', { count: topics.length, defaultValue: `Chủ đề (${topics.length})` })}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'settings'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            {t('teacher.aiWizard.detailModal.tabSettings', 'Cấu hình bài tập & lộ trình')}
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* TAB 1: QUESTIONS LIST */}
          {activeTab === 'questions' && (
            <div className="space-y-4">
              {/* Quick toolbar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5">
                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-600">
                  <span>{t('teacher.aiWizard.detailModal.quickModeLabel', 'Kiểu bài tập:')}</span>
                  <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded-lg">
                    {assignmentMode === 'exam'
                      ? t('teacher.aiWizard.modal.modeExam', 'Kiểm tra')
                      : assignmentMode === 'adaptive'
                      ? t('teacher.aiWizard.modal.modeAdaptive', 'Ngắt quãng')
                      : t('teacher.aiWizard.modal.modeStandard', 'Luyện tập tiêu chuẩn')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('settings')}
                    className="text-xs text-indigo-600 hover:underline font-semibold ml-1"
                  >
                    ({t('teacher.aiWizard.detailModal.changeSettingsLink', 'Đổi cấu hình')})
                  </button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setActiveTab('topics');
                    setIsAddingTopic(true);
                  }}
                  className="text-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('teacher.aiWizard.detailModal.addTopicBtn', 'Thêm chủ đề mới')}
                </Button>
              </div>

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
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          #{qIndex + 1}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                          {getQuestionTypeLabel(q.question_type)}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                          {t('teacher.aiWizard.detailModal.difficultyLabel', { level: q.difficulty, defaultValue: `Độ khó ${q.difficulty}` })}
                        </span>
                        
                        {/* Topic selector for this question */}
                        {topics.length > 0 && (
                          <div className="flex items-center gap-1.5 min-w-[200px] max-w-[280px]">
                            <span className="text-[11px] text-slate-400 font-medium whitespace-nowrap">
                              {t('teacher.aiWizard.detailModal.topicCol', 'Chủ đề:')}
                            </span>
                            <Select
                              size="sm"
                              value={q.topic_temp_id}
                              onChange={(val) =>
                                handleUpdateQuestion(q.temp_id, { topic_temp_id: val })
                              }
                              options={topics.map((top) => ({
                                label: top.name,
                                value: top.temp_id,
                              }))}
                              className="flex-1"
                            />
                          </div>
                        )}
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
                          <span>{t('teacher.aiWizard.detailModal.regenThisQuestion', 'Tạo lại câu này')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteQuestion(q.temp_id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          aria-label="Xóa câu hỏi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Regeneration Prompt Popover */}
                    {isShowPrompt && (
                      <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2">
                        <label className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
                          {t('teacher.aiWizard.detailModal.regenPromptLabel', 'Chỉ dẫn tạo lại (tuỳ chọn):')}
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
                            placeholder={t('teacher.aiWizard.detailModal.regenPromptPlaceholder', 'Ví dụ: Đổi câu hỏi khó hơn, tập trung vào thì quá khứ...')}
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
                              t('teacher.aiWizard.detailModal.submitRegen', 'Tạo lại')
                            )}
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Question Content Input */}
                    <div>
                      <textarea
                        rows={2}
                        value={q.content}
                        onChange={(e) =>
                          handleUpdateQuestion(q.temp_id, { content: e.target.value })
                        }
                        className="w-full text-xs sm:text-sm font-semibold text-slate-800 border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 outline-none bg-slate-50/30"
                      />
                    </div>

                    {/* Evidence Quote Anchor */}
                    <AiEvidenceQuoteBox quote={q.evidence_quote} />

                    {/* Matching Pairs or Answer Options */}
                    {q.question_type === 'matching' ? (
                      <div className="space-y-2 pt-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          {t('teacher.aiWizard.detailModal.matchingPairsTitle', 'Các cặp từ tương ứng:')}
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {(q.metadata?.pairs || []).map((pair, pIdx) => (
                            <div
                              key={pIdx}
                              className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                            >
                              <span className="font-bold text-slate-700 min-w-0 flex-1 truncate">
                                {pair.leftText}
                              </span>
                              <span className="text-slate-400 font-bold">↔</span>
                              <span className="font-bold text-indigo-700 min-w-0 flex-1 truncate">
                                {pair.rightText}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2 pt-1">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            {t('teacher.aiWizard.detailModal.optionsTitle', 'Các phương án trả lời:')}
                          </label>
                          <span className="text-[11px] text-slate-400">
                            {t('teacher.aiWizard.detailModal.toggleCorrectHint', 'Bấm vào vòng tròn để đặt đáp án đúng')}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.answer_options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${
                                opt.is_correct
                                  ? 'bg-emerald-50/60 border-emerald-300 ring-1 ring-emerald-400/20'
                                  : 'bg-white border-slate-200 hover:border-slate-300'
                              }`}
                            >
                              <button
                                type="button"
                                onClick={() => handleToggleOptionCorrect(q.temp_id, optIdx)}
                                className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                                  opt.is_correct
                                    ? 'bg-emerald-600 text-white'
                                    : 'border-2 border-slate-300 hover:border-slate-400'
                                }`}
                              >
                                {opt.is_correct && <Check className="w-3 h-3 stroke-[3]" />}
                              </button>

                              <input
                                type="text"
                                value={opt.content}
                                onChange={(e) => {
                                  const updatedOpts = q.answer_options.map((o, i) =>
                                    i === optIdx ? { ...o, content: e.target.value } : o
                                  );
                                  handleUpdateQuestion(q.temp_id, {
                                    answer_options: updatedOpts,
                                  });
                                }}
                                className="w-full text-xs bg-transparent border-none focus:outline-none font-medium text-slate-800"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {questions.length === 0 && (
                <div className="text-center py-10 border-2 border-dashed border-slate-200 rounded-3xl p-6 text-slate-400">
                  <FileQuestion className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">
                    {t('teacher.aiWizard.detailModal.noQuestions', 'Chưa có câu hỏi nào trong bài học này')}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: TOPICS LIST */}
          {activeTab === 'topics' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between bg-slate-50 border border-slate-200/80 rounded-2xl p-4">
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    {t('teacher.aiWizard.detailModal.topicsManageTitle', 'Danh sách chủ đề')}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {t('teacher.aiWizard.detailModal.topicsManageDesc', 'Chủ đề dù chưa có câu hỏi nào vẫn sẽ được lưu vào hệ thống khi Hoàn tất lộ trình.')}
                  </p>
                </div>

                {!isAddingTopic && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddingTopic(true)}
                    className="text-xs shadow-md shadow-indigo-100"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1" />
                    {t('teacher.aiWizard.detailModal.addTopicBtn', 'Thêm chủ đề mới')}
                  </Button>
                )}
              </div>

              {/* Add Topic Inline Form */}
              {isAddingTopic && (
                <div className="bg-indigo-50/50 border border-indigo-200 rounded-2xl p-4 space-y-3 animate-in fade-in">
                  <h5 className="text-xs font-bold text-indigo-900 uppercase tracking-wider">
                    {t('teacher.aiWizard.detailModal.newTopicFormTitle', 'Tạo chủ đề mới')}
                  </h5>
                  <input
                    type="text"
                    required
                    value={newTopicName}
                    onChange={(e) => setNewTopicName(e.target.value)}
                    placeholder={t('teacher.aiWizard.detailModal.topicNamePlaceholder', 'Tên chủ đề (ví dụ: Thì Quá khứ đơn, Từ vựng Gia đình...)')}
                    className="w-full text-xs sm:text-sm font-semibold border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <input
                    type="text"
                    value={newTopicDesc}
                    onChange={(e) => setNewTopicDesc(e.target.value)}
                    placeholder={t('teacher.aiWizard.detailModal.topicDescPlaceholder', 'Mô tả ngắn gọn về chủ đề này (tuỳ chọn)')}
                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingTopic(false)}
                      className="text-xs"
                    >
                      {t('teacher.aiWizard.lessonsStage.cancelBtn', 'Hủy')}
                    </Button>
                    <Button
                      type="button"
                      variant="primary"
                      size="sm"
                      onClick={handleAddTopic}
                      disabled={!newTopicName.trim()}
                      className="text-xs"
                    >
                      {t('teacher.aiWizard.detailModal.saveTopicBtn', 'Lưu chủ đề')}
                    </Button>
                  </div>
                </div>
              )}

              {/* Topics Grid */}
              <div className="space-y-2.5">
                {topics.map((topic, tIdx) => {
                  const assignedCount = questions.filter((q) => q.topic_temp_id === topic.temp_id).length;

                  return (
                    <div
                      key={topic.temp_id}
                      className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-sm hover:border-slate-300 transition-all"
                    >
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs flex items-center justify-center">
                            #{tIdx + 1}
                          </span>
                          <h5 className="text-sm font-bold text-slate-800 truncate">{topic.name}</h5>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            assignedCount > 0
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-slate-100 text-slate-500 border border-slate-200'
                          }`}>
                            {t('teacher.aiWizard.detailModal.assignedQuestionsCount', {
                              count: assignedCount,
                              defaultValue: `${assignedCount} câu hỏi`,
                            })}
                          </span>
                        </div>
                        {topic.description && (
                          <p className="text-xs text-slate-500 pl-8">{topic.description}</p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic.temp_id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                        aria-label="Xóa chủ đề"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS (ASSIGNMENT & CURRICULUM CONFIGURATION) */}
          {activeTab === 'settings' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Section 1: Lesson in Curriculum Settings */}
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {t('teacher.aiWizard.detailModal.curriculumSectionTitle', 'Cấu hình Đề cương Lộ trình')}
                    </h4>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {lesson.title}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      {isCurriculumPublished ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                      {t('teacher.aiWizard.detailModal.isCurriculumPublishedLabel', 'Công khai bài học trong lộ trình')}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {t('teacher.aiWizard.detailModal.isCurriculumPublishedDesc', 'Cho phép học sinh nhìn thấy và xem nội dung bài học này trên lộ trình lớp học.')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCurriculumPublished}
                    onChange={(e) => setIsCurriculumPublished(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-indigo-600" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      {t('teacher.aiWizard.detailModal.assignmentSectionTitle', 'Cấu hình Bài tập gắn kèm')}
                    </h4>
                  </div>
                  <span className="text-xs text-slate-500 font-medium">
                    {t('teacher.aiWizard.detailModal.assignmentQuestionsCount', { count: questions.length, defaultValue: `${questions.length} câu hỏi` })}
                  </span>
                </div>

                {/* Publish Toggle */}
                <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3.5">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800">
                      {t('teacher.aiWizard.detailModal.isAssignmentPublishedLabel', 'Phát hành bài tập')}
                    </span>
                    <p className="text-[11px] text-slate-500">
                      {t('teacher.aiWizard.detailModal.isAssignmentPublishedDesc', 'Học sinh có thể bắt đầu làm bài ngay sau khi lộ trình được tạo.')}
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={isAssignmentPublished}
                    onChange={(e) => setIsAssignmentPublished(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                  />
                </div>

                {/* Fields Grid: Mode, Attempts, Time Limit, Deadline */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-1">
                  {/* 1. Kiểu bài tập (Select Component) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      {t('teacher.aiWizard.detailModal.assignmentModeLabel', 'Kiểu bài tập:')}
                    </label>
                    <Select
                      size="sm"
                      value={assignmentMode}
                      onChange={(val) => {
                        setAssignmentMode(val as any);
                        if (val === 'exam') {
                          if (maxAttempts === 0) setMaxAttempts(1);
                          if (!timeLimitMinutes) setTimeLimitMinutes('45');
                        }
                      }}
                      options={[
                        { label: t('teacher.aiWizard.modal.modeStandard', 'Luyện tập tiêu chuẩn'), value: 'standard' },
                        { label: t('teacher.aiWizard.modal.modeAdaptive', 'Luyện tập ngắt quãng'), value: 'adaptive' },
                        { label: t('teacher.aiWizard.modal.modeExam', 'Kiểm tra / Thi cử'), value: 'exam' },
                      ]}
                    />
                  </div>

                  {/* 2. Số lần làm tối đa */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                      {t('teacher.aiWizard.detailModal.maxAttemptsLabel', 'Số lần làm tối đa:')}
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={maxAttempts}
                      onChange={(e) => setMaxAttempts(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="0 = Không giới hạn"
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* 3. Thời gian làm (phút) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {t('teacher.aiWizard.detailModal.timeLimitLabel', 'Thời gian làm (phút):')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={timeLimitMinutes}
                      onChange={(e) => setTimeLimitMinutes(e.target.value)}
                      placeholder="Không giới hạn"
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  {/* 4. Hạn chót nộp bài */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {t('teacher.aiWizard.detailModal.deadlineLabel', 'Hạn chót nộp bài:')}
                    </label>
                    <input
                      type="datetime-local"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between gap-3 bg-slate-50/50 shrink-0">
          <Button variant="outline" size="sm" onClick={onClose}>
            {t('teacher.aiWizard.detailModal.closeBtn', 'Đóng')}
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
                {t('teacher.aiWizard.detailModal.saving', 'Đang lưu...')}
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                {t('teacher.aiWizard.detailModal.saveChanges', 'Lưu thay đổi')}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
