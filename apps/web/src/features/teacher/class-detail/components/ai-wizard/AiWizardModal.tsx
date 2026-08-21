import React, { useState } from 'react';
import { BookOpen, X, Layers, ArrowLeft } from 'lucide-react';
import { toast } from '@/utils/toast';
import { AiWizardUploadStep } from './AiWizardUploadStep';
import { AiWizardLessonsStage } from './AiWizardLessonsStage';
import { AiLessonDetailModal } from './AiLessonDetailModal';
import { AiCommitSuccessModal } from './AiCommitSuccessModal';
import { useAiWizard } from '../../hooks/useAiWizard';
import type {
  CommitWizardResult,
  WizardTopic,
  WizardQuestion,
} from '../../types/aiWizard.types';

interface AiWizardModalProps {
  classId: string;
  onClose: () => void;
}

export const AiWizardModal: React.FC<AiWizardModalProps> = ({ classId, onClose }) => {
  const {
    curriculumTitle,
    setCurriculumTitle,
    curriculumDescription,
    setCurriculumDescription,
    lessons,
    setLessons,
    topicsByLesson,
    questionsByLesson,
    isGenerating,
    overallProgress,
    step1Mutation,
    saveLessonsMutation,
    startBatchGeneration,
    updateDetailMutation,
    regenerateQuestionMutation,
    commitMutation,
    deleteDraftMutation,
  } = useAiWizard(classId);

  const [inspectingLessonId, setInspectingLessonId] = useState<string | null>(null);
  const [commitResult, setCommitResult] = useState<CommitWizardResult | null>(null);

  // Step 1: Upload & Extract Outline
  const handleExtract = async (payload: { file?: File; documentText?: string }) => {
    try {
      await step1Mutation.mutateAsync(payload);
      toast.success('Phân tích giáo trình và trích xuất lộ trình thành công!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra khi phân tích tài liệu');
    }
  };

  // Step 2: Update Header & Save
  const handleUpdateHeader = (title: string, description: string) => {
    setCurriculumTitle(title);
    setCurriculumDescription(description);
  };

  // Update Lessons List & Auto-save
  const handleUpdateLessons = async (updatedLessons: typeof lessons) => {
    setLessons(updatedLessons);
    try {
      await saveLessonsMutation.mutateAsync(updatedLessons);
    } catch (err) {
      console.error('Failed to auto-save lessons', err);
    }
  };

  // Start Batch Generation
  const handleStartBatchGen = async (lessonTempIds?: string[]) => {
    try {
      await startBatchGeneration(lessonTempIds);
      toast.success('Đã hoàn thành sinh toàn bộ chủ đề và câu hỏi!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Có lỗi xảy ra trong quá trình sinh nội dung');
    }
  };

  // Save Detail Modal (Topics + Questions)
  const handleSaveLessonDetail = async (
    topics: WizardTopic[],
    questions: WizardQuestion[]
  ) => {
    if (!inspectingLessonId) return;
    try {
      await updateDetailMutation.mutateAsync({
        lessonTempId: inspectingLessonId,
        topics,
        questions,
      });
      toast.success('Đã lưu chi tiết bài học thành công!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi lưu chi tiết bài học');
      throw err;
    }
  };

  // Regenerate Single Question
  const handleRegenerateQuestion = async (
    lessonTempId: string,
    questionTempId: string,
    instruction?: string
  ) => {
    try {
      const newQ = await regenerateQuestionMutation.mutateAsync({
        lessonTempId,
        questionTempId,
        instruction,
      });
      toast.success('Đã sinh lại câu hỏi thành công!');
      return newQ;
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Lỗi khi sinh lại câu hỏi');
      throw err;
    }
  };

  // Commit Wizard to Database
  const handleCommit = async () => {
    try {
      const result = await commitMutation.mutateAsync();
      setCommitResult(result);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi lưu vào lớp học');
    }
  };

  // Discard Draft
  const handleDiscardDraft = async () => {
    if (window.confirm('Bạn có chắc chắn muốn hủy bản nháp và làm lại từ đầu?')) {
      try {
        await deleteDraftMutation.mutateAsync();
        toast.success('Đã hủy bản nháp thành công');
      } catch (err: any) {
        toast.error(err?.response?.data?.message || 'Lỗi khi hủy bản nháp');
      }
    }
  };

  const selectedLesson = inspectingLessonId
    ? lessons.find((l) => l.temp_id === inspectingLessonId)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden">
        {/* Main Wizard Top Header */}
        <div className="px-6 py-4 sm:py-5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-200 shrink-0">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                Trình Tạo Lộ Trình AI
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {lessons.length === 0
                  ? 'Bước 1: Phân tích giáo trình & trích xuất lộ trình'
                  : 'Bước 2: Quản lý bài học & sinh ngân hàng câu hỏi'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating || commitMutation.isPending}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition-colors disabled:opacity-30"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7">
          {lessons.length === 0 ? (
            <AiWizardUploadStep
              onExtract={handleExtract}
              isLoading={step1Mutation.isPending}
            />
          ) : (
            <AiWizardLessonsStage
              curriculumTitle={curriculumTitle}
              curriculumDescription={curriculumDescription}
              onUpdateHeader={handleUpdateHeader}
              lessons={lessons}
              onUpdateLessons={handleUpdateLessons}
              onOpenDetailModal={(tempId) => setInspectingLessonId(tempId)}
              onStartBatchGen={handleStartBatchGen}
              isGenerating={isGenerating}
              overallProgress={overallProgress}
              onCommit={handleCommit}
              isCommitting={commitMutation.isPending}
              onDiscardDraft={handleDiscardDraft}
              isDiscarding={deleteDraftMutation.isPending}
            />
          )}
        </div>
      </div>

      {/* Inspect Detail Modal */}
      {selectedLesson && (
        <AiLessonDetailModal
          lesson={selectedLesson}
          topics={topicsByLesson[selectedLesson.temp_id] || []}
          questions={questionsByLesson[selectedLesson.temp_id] || []}
          onClose={() => setInspectingLessonId(null)}
          onSave={handleSaveLessonDetail}
          onRegenerateQuestion={handleRegenerateQuestion}
        />
      )}

      {/* Commit Success Celebration Modal */}
      {commitResult && (
        <AiCommitSuccessModal
          result={commitResult}
          onClose={() => {
            setCommitResult(null);
            onClose();
          }}
        />
      )}
    </div>
  );
};
