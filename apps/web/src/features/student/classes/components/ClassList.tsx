import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ClassItem } from '../types';

interface ClassListProps {
  classes: ClassItem[];
}

export const ClassList: React.FC<ClassListProps> = ({ classes }) => {
  const { t } = useTranslation();

  if (!classes || classes.length === 0) {
    return (
      <div className="py-32 text-center border-2 border-dashed border-zinc-400">
        <p className="text-3xl font-black uppercase tracking-tighter text-zinc-400">
          {t('student.classes.noClasses')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {classes.map((cls) => (
        <Link 
          key={cls.id} 
          to={`/student/classes/${cls.class_id}`} 
          className="group block border-2 border-zinc-900 p-8 hover:-translate-y-2 hover:shadow-[8px_8px_0_0_#4f46e5] hover:border-indigo-600 transition-all bg-[#FDFBF7]"
        >
          <div className="flex flex-col h-full justify-between gap-12">
            <div>
              <h4 className="text-3xl font-black tracking-tighter uppercase group-hover:text-indigo-600 transition-colors mb-4">
                {cls.class?.name || cls.name}
              </h4>
              <p className="text-zinc-600 font-medium text-lg leading-relaxed line-clamp-3">
                {cls.class?.description || cls.description}
              </p>
            </div>
            <div className="pt-6 border-t-2 border-zinc-200 group-hover:border-indigo-600 transition-colors flex justify-between items-end">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-1 group-hover:text-indigo-400">
                  {t('student.classes.instructor')}
                </p>
                <p className="font-black text-xl uppercase tracking-tight">
                  {cls.class?.teacher?.full_name || cls.teacher_name}
                </p>
              </div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
};
