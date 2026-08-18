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
    <Card className="flex flex-col hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group">
      <CardHeader className="p-6 pb-4">
        <div className="flex justify-between items-start gap-2">
          <CardTitle className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
            {cls.name}
          </CardTitle>
          <Badge variant="indigo" size="sm" className="select-all cursor-pointer shrink-0">
            {t('teacher.dashboard.code', { code: cls.join_code })}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 pt-0 flex-1 flex flex-col justify-between">
        <p className="text-slate-500 text-sm mb-6 line-clamp-2 leading-relaxed font-medium">
          {cls.description || t('teacher.dashboard.noDescription')}
        </p>
        
        <div className="flex items-center text-sm font-semibold text-slate-700 bg-slate-50 rounded-xl p-3 border border-slate-100">
          <Users className="w-4 h-4 mr-2 text-indigo-600 shrink-0" />
          {t('teacher.dashboard.studentsCount', { count: cls._count?.members || 0 })}
        </div>
      </CardContent>

      <CardFooter className="p-6 pt-0 mt-auto">
        <Link to={`/teacher/classes/${cls.id}`} className="w-full">
          <Button variant="outline" className="w-full justify-center group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-200 transition-all duration-200">
            {t('teacher.dashboard.viewDetails')} <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
};

