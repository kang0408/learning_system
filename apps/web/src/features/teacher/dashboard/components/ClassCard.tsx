import { Link } from 'react-router-dom';
import { Users, ArrowRight } from 'lucide-react';
import type { TeacherClassItem } from '../types';
import { useTranslation } from 'react-i18next';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';

interface ClassCardProps {
  cls: TeacherClassItem;
}

export const ClassCard: React.FC<ClassCardProps> = ({ cls }) => {
  const { t } = useTranslation();
  return (
    <Card className="flex flex-col rounded-2xl border-slate-200/80 bg-slate-50/40 hover:bg-white hover:shadow-md hover:shadow-indigo-950/5 hover:border-indigo-200 transition-all duration-300 group">
      <CardHeader className="p-5 pb-3">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {cls.name}
          </CardTitle>
          <Badge variant="indigo" size="sm" className="select-all cursor-pointer shrink-0 font-mono text-xs">
            {t('teacher.dashboard.code', { code: cls.join_code })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-5 pt-0 flex-1 flex flex-col justify-between">
        <p className="text-slate-500 text-sm mb-5 line-clamp-2 leading-relaxed font-medium">
          {cls.description || t('teacher.dashboard.noDescription')}
        </p>
        
        <div className="flex items-center text-xs font-semibold text-slate-700 bg-white/80 rounded-xl p-2.5 border border-slate-200/60 shadow-xs">
          <Users className="w-4 h-4 mr-2 text-indigo-600 shrink-0" />
          {t('teacher.dashboard.studentsCount', { count: cls._count?.members || 0 })}
        </div>
      </CardContent>

      <CardFooter className="p-5 pt-0 mt-auto">
        <Link to={`/teacher/classes/${cls.id}`} className="w-full">
          <Button variant="outline" className="w-full justify-center rounded-xl font-semibold border-slate-200/80 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-all duration-200">
            {t('teacher.dashboard.viewDetails')} <ArrowRight className="w-4 h-4 ml-2 transition-transform duration-200 group-hover:translate-x-1" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

