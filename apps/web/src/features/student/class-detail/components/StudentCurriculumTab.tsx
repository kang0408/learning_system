import React from 'react';
import { Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { CurriculumLessonCard } from './CurriculumLessonCard';
import type { StudentCurriculum } from '../types/curriculum.types';

interface StudentCurriculumTabProps {
  curriculums: StudentCurriculum[];
  classId?: string;
}

export const StudentCurriculumTab: React.FC<StudentCurriculumTabProps> = ({
  curriculums,
  classId
}) => {
  const { t } = useTranslation();

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-4xl font-black tracking-tighter uppercase text-zinc-900">
          {t('student.classDetail.curriculumRoadmap')}
        </h2>
        <div className="font-mono font-bold text-xs uppercase px-3 py-1.5 border-2 border-zinc-900 bg-indigo-50 text-indigo-900 w-fit">
          {t('student.classDetail.curriculumHint')}
        </div>
      </div>

      {curriculums.length === 0 ? (
        <div className="border-4 border-zinc-900 bg-white p-12 text-center shadow-[6px_6px_0_0_#18181b]">
          <div className="w-16 h-16 border-2 border-zinc-900 bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-[3px_3px_0_0_#18181b]">
            <Layers className="w-8 h-8" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tight text-zinc-900 mb-2">
            {t('student.classDetail.noCurriculums')}
          </h3>
          <p className="text-zinc-600 font-medium max-w-md mx-auto">
            {t('student.classDetail.noCurriculumsDesc')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {curriculums.map((curriculum, index) => (
            <CurriculumLessonCard
              key={curriculum.id}
              curriculum={curriculum}
              index={index}
              classId={classId}
            />
          ))}
        </div>
      )}
    </div>
  );
};
