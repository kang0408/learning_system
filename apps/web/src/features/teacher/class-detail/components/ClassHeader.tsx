import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, GraduationCap, BookOpen, Compass, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';

export type ClassDetailTab = 'analytics' | 'students' | 'assignments' | 'curriculum';

interface ClassHeaderProps {
  classDetails: any;
  activeTab: ClassDetailTab;
  onTabChange: (tab: ClassDetailTab) => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

export function ClassHeader({ classDetails, activeTab, onTabChange, onEditClick, onDeleteClick }: ClassHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition duration-300">
        <div className="flex items-center mb-4 md:mb-0">
          <Link to="/teacher" className="mr-5 p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors" aria-label={t('teacher.classDetail.back')}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{classDetails?.name || t('teacher.classDetail.loading')}</h1>
              <Badge variant="secondary" size="md">
                {classDetails?.subject || t('teacher.classDetail.loading')}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
              <span>{t('teacher.classDetail.joinCode')}</span>
              <Badge variant="indigo" size="sm" className="select-all cursor-pointer">
                {classDetails?.join_code || '---'}
              </Badge>
            </p>
          </div>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="outline" size="icon">
              <MoreVertical className="w-5 h-5 text-slate-600" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="right">
            <DropdownMenuItem onClick={onEditClick}>
              <Edit2 className="w-4 h-4 mr-2" /> {t('teacher.classDetail.edit')}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onClick={onDeleteClick}>
              <Trash2 className="w-4 h-4 mr-2" /> {t('teacher.classDetail.deleteClass')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div 
        className="flex border bg-white p-2 rounded-2xl shadow-sm border-gray-100 gap-1.5 overflow-x-auto"
        role="tablist"
        aria-label="Class Management Tabs"
      >
        {(['analytics', 'curriculum', 'assignments', 'students'] as const).map(tab => {
          const isSelected = activeTab === tab;
          return (
            <button
              key={tab}
              role="tab"
              aria-selected={isSelected}
              aria-controls={`${tab}-panel`}
              id={`${tab}-tab`}
              onClick={() => onTabChange(tab)}
              className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm transition-all duration-300 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              {tab === 'analytics' && <BarChart2 className="w-4 h-4" aria-hidden="true" />}
              {tab === 'curriculum' && <Compass className="w-4 h-4" aria-hidden="true" />}
              {tab === 'assignments' && <BookOpen className="w-4 h-4" aria-hidden="true" />}
              {tab === 'students' && <GraduationCap className="w-4 h-4" aria-hidden="true" />}
              {tab === 'analytics'
                ? t('teacher.classDetail.analyticsTab')
                : tab === 'curriculum'
                ? t('teacher.classDetail.curriculumTab')
                : tab === 'assignments'
                ? t('teacher.classDetail.assignmentsTab')
                : t('teacher.classDetail.studentsTab')}
            </button>
          );
        })}
      </div>
    </div>
  );
}

