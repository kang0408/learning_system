import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { ClassDetailData } from '../types';

interface ClassHeaderProps {
  classData: ClassDetailData;
}

export const ClassHeader: React.FC<ClassHeaderProps> = ({ classData }) => {
  const { t } = useTranslation();

  return (
    <div className="border-b-4 border-indigo-600 pb-12">
      <Link 
        to="/student/classes" 
        className="inline-flex items-center text-indigo-600 font-bold uppercase tracking-widest text-sm mb-12 hover:bg-indigo-600 hover:text-white px-3 py-1 border-2 border-transparent hover:border-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> 
        {t('student.classDetail.backToClasses')}
      </Link>
      
      <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-8 text-zinc-900">
        {classData.name}
      </h1>
      
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mt-12 pt-8 border-t-2 border-zinc-200">
        <p className="text-xl md:text-2xl font-medium max-w-2xl leading-relaxed text-zinc-700">
          {classData.description}
        </p>
        <div className="text-right shrink-0">
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-1">
            {t('student.classDetail.instructor')}
          </p>
          <p className="text-3xl font-black tracking-tighter uppercase">
            {classData.teacher?.full_name}
          </p>
        </div>
      </div>
    </div>
  );
};
