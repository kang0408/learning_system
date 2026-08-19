import React from 'react';
import { ExternalLink } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CurriculumMaterial } from '../types/curriculum.types';

interface LessonMaterialsListProps {
  materials?: CurriculumMaterial[];
}

export const LessonMaterialsList: React.FC<LessonMaterialsListProps> = ({ materials }) => {
  const { t } = useTranslation();

  if (!materials || materials.length === 0) return null;

  const formatFileSize = (bytes?: number | null) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-widest text-zinc-500">
        <span>{t('student.classDetail.materialsSection', { count: materials.length })}</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {materials.map((mat, idx) => (
          <a
            key={mat.id || idx}
            href={mat.file_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-4 bg-white border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 border-2 border-zinc-900 bg-indigo-50 text-indigo-900 flex items-center justify-center font-mono font-black text-xs shrink-0 uppercase">
                {mat.file_type || 'DOC'}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-black uppercase tracking-tight text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                  {mat.title}
                </div>
                {mat.file_size ? (
                  <div className="text-xs font-mono text-zinc-500 mt-0.5">
                    {formatFileSize(mat.file_size)}
                  </div>
                ) : null}
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-400 group-hover:text-indigo-600 shrink-0 ml-2" />
          </a>
        ))}
      </div>
    </div>
  );
};
