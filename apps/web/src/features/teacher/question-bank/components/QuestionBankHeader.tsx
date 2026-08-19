import React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Folder } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

interface QuestionBankHeaderProps {
  totalTopics: number;
  onOpenCreateTopic: () => void;
  onOpenCreateQuestion: () => void;
}

export const QuestionBankHeader: React.FC<QuestionBankHeaderProps> = ({
  totalTopics,
  onOpenCreateTopic,
  onOpenCreateQuestion
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition duration-300">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('teacher.questionBank.header.title')}</h1>
          <Badge variant="warning" size="md">
            {t('teacher.questionBank.header.topicCount', { count: totalTopics })}
          </Badge>
        </div>
        <p className="text-sm text-slate-500 font-medium mt-1">{t('teacher.questionBank.header.description')}</p>
      </div>
      <div className="flex flex-wrap gap-3 mt-4 md:mt-0">
        <Button
          variant="outline"
          size="md"
          className="bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-100/80"
          onClick={onOpenCreateTopic}
        >
          <Folder className="w-4 h-4 mr-2 text-indigo-600" /> {t('teacher.questionBank.header.createTopic')}
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={onOpenCreateQuestion}
        >
          <Plus className="w-4 h-4 mr-2" /> {t('teacher.questionBank.header.createQuestion')}
        </Button>
      </div>
    </div>
  );
};
