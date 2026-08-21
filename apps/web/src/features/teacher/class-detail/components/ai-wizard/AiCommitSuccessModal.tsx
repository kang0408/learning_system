import React from 'react';
import {
  CheckCircle2,
  BookOpen,
  Layers,
  FileQuestion,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { CommitWizardResult } from '../../types/aiWizard.types';

interface AiCommitSuccessModalProps {
  result: CommitWizardResult;
  onClose: () => void;
}

export const AiCommitSuccessModal: React.FC<AiCommitSuccessModalProps> = ({
  result,
  onClose,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl w-full max-w-md p-6 sm:p-8 text-center space-y-6">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <h3 className="text-xl font-bold text-slate-900">
            Lưu Lộ Trình Thành Công!
          </h3>
          <p className="text-xs sm:text-sm text-slate-500">
            Toàn bộ cấu trúc bài học, chủ đề kiến thức và bộ bài tập đã được tích hợp trực tiếp vào lớp học.
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bài học</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {result.curriculums_created}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <span>Chủ đề</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {result.topics_created}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <FileQuestion className="w-3.5 h-3.5 text-indigo-600" />
              <span>Câu hỏi</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {result.questions_created}
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/70 rounded-2xl p-3.5 space-y-1 text-left">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <FileCheck className="w-3.5 h-3.5 text-indigo-600" />
              <span>Bài tập tự động</span>
            </div>
            <p className="text-xl font-bold text-slate-900">
              {result.assignments_created}
            </p>
          </div>
        </div>

        {/* Action Button */}
        <Button
          variant="primary"
          size="lg"
          onClick={onClose}
          className="w-full shadow-md shadow-indigo-100"
        >
          <span>Xem Danh Sách Lộ Trình</span>
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
