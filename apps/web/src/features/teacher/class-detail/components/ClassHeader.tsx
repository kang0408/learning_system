import { Link } from 'react-router-dom';
import { ArrowLeft, BarChart2, GraduationCap, BookOpen, Compass, MoreVertical, Edit2, Trash2, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '@/components/ui/Badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/DropdownMenu';
import { Button } from '@/components/ui/Button';

export type ClassDetailTab = 'analytics' | 'curriculum' | 'assignments' | 'students';

interface ClassHeaderProps {
  classDetails: any;
  activeTab: ClassDetailTab;
  onTabChange: (tab: ClassDetailTab) => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
  onExportClick?: () => void;
}

export function ClassHeader({ classDetails, activeTab, onTabChange, onEditClick, onDeleteClick, onExportClick }: ClassHeaderProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
        <div className="flex items-center mb-2 md:mb-0">
          <Link to="/teacher" className="mr-4 p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-all shadow-xs" aria-label={t('teacher.classDetail.back')}>
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">{classDetails?.name || t('teacher.classDetail.loading')}</h1>
              <Badge variant="indigo" size="md">
                {classDetails?.subject || t('teacher.classDetail.loading')}
              </Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2 font-medium">
              <span>{t('teacher.classDetail.joinCode')}</span>
              <Badge variant="indigo" size="sm" className="select-all cursor-pointer font-mono font-bold">
                {classDetails?.join_code || '---'}
              </Badge>
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 self-end md:self-auto">
          <DropdownMenu>
            <DropdownMenuTrigger>
              <Button variant="outline" size="icon" className="rounded-xl border-slate-200/80 hover:border-indigo-200">
                <MoreVertical className="w-5 h-5 text-slate-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="right" className="w-52 rounded-2xl shadow-md border-slate-200/80">
              {onExportClick && (
                <>
                  <DropdownMenuItem onClick={onExportClick} className="rounded-xl">
                    <FileText className="w-4 h-4 mr-2.5 text-indigo-600" /> {t('teacher.classDetail.exportReport', 'Xuất Báo Cáo PDF')}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem onClick={onEditClick} className="rounded-xl">
                <Edit2 className="w-4 h-4 mr-2 text-slate-600" /> {t('teacher.classDetail.edit')}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive onClick={onDeleteClick} className="rounded-xl">
                <Trash2 className="w-4 h-4 mr-2" /> {t('teacher.classDetail.deleteClass')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div 
        className="flex bg-slate-100/70 p-1.5 rounded-2xl border border-slate-200/60 gap-1.5 overflow-x-auto"
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
              className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl font-bold text-sm transition-all duration-200 whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-xs shadow-indigo-950/10 font-bold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60 font-semibold'
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

