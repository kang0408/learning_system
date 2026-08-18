import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface DashboardHeaderProps {
  totalClasses: number;
  onCreateClick: () => void;
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ totalClasses, onCreateClick }) => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 transition duration-300">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('teacher.dashboard.title')}</h1>
          <Badge variant="indigo" size="md">
            {t('teacher.dashboard.totalCount', { count: totalClasses })}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 mt-1 font-medium">{t('teacher.dashboard.subtitle')}</p>
      </div>
      <Button
        onClick={onCreateClick}
        variant="primary"
        size="md"
        className="mt-4 md:mt-0"
      >
        <Plus className="w-4 h-4 mr-2" /> {t('teacher.dashboard.createBtn')}
      </Button>
    </div>
  );
};

