import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { CurriculumMaterial } from '../types/curriculum.types';

interface LessonMaterialsListProps {
  materials?: CurriculumMaterial[];
  onSelectMaterial?: (material: CurriculumMaterial) => void;
}

export const LessonMaterialsList: React.FC<LessonMaterialsListProps> = ({
  materials,
  onSelectMaterial,
}) => {
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 font-mono font-bold text-xs uppercase tracking-widest text-zinc-500">
          <span>{t('student.classDetail.materialsSection', { count: materials.length })}</span>
        </div>
        <span className="font-mono text-[11px] text-indigo-600 font-bold hidden sm:inline">
          * Nhấp vào tài liệu để mở xem trực tiếp
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {materials.map((mat, idx) => (
          <div
            key={mat.id || idx}
            onClick={() => onSelectMaterial?.(mat)}
            className="flex items-center justify-between p-4 bg-white border-2 border-zinc-900 shadow-[3px_3px_0_0_#18181b] hover:shadow-none hover:translate-x-[2px] hover:translate-y-[2px] transition-all cursor-pointer group select-none"
          >
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="w-9 h-9 border-2 border-zinc-900 bg-indigo-50 text-indigo-900 flex items-center justify-center font-mono font-black text-xs shrink-0 uppercase group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                {mat.file_type || 'DOC'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-black uppercase tracking-tight text-zinc-900 truncate group-hover:text-indigo-600 transition-colors">
                  {mat.title}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {mat.file_size ? (
                    <span className="text-xs font-mono text-zinc-500">
                      {formatFileSize(mat.file_size)}
                    </span>
                  ) : null}
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    <Eye className="w-2.5 h-2.5" /> Xem trước
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <a
                href={mat.file_url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="p-1.5 text-zinc-400 hover:text-indigo-600 hover:bg-zinc-100 rounded transition-colors"
                title="Mở trong tab mới"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
