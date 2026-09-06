import React from 'react';
import { ArrowLeft, Edit2, Trash2, Plus, Sparkles, MoreVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Topic } from '../types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu';

interface TopicDetailHeaderProps {
  topic: Topic;
  onOpenEditTopic: () => void;
  onOpenDeleteTopic: () => void;
  onOpenCreateQuestion: () => void;
  onOpenGenerateAi: () => void;
}

export const TopicDetailHeader: React.FC<TopicDetailHeaderProps> = ({
  topic,
  onOpenEditTopic,
  onOpenDeleteTopic,
  onOpenCreateQuestion,
  onOpenGenerateAi,
}) => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-slate-100 gap-4">
      <div className="flex items-center mb-2 md:mb-0">
        <button
          onClick={() => navigate('/teacher/questions')}
          className="mr-4 p-2.5 rounded-xl bg-slate-100/80 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 border border-slate-200/60 transition-all shadow-xs"
          aria-label={t('teacher.classDetail.back', 'Quay lại')}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">{topic?.name}</h1>
            <Badge variant="indigo" size="md">
              {t('teacher.topicDetail.headerBadge')}
            </Badge>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {topic?.description || t('teacher.topicDetail.headerNoDesc')}
          </p>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger>
          <Button variant="outline" size="icon" className="rounded-xl border-slate-200/80 hover:border-indigo-200" aria-label="Tùy chọn chủ đề">
            <MoreVertical className="w-5 h-5 text-slate-600" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="right">
          <DropdownMenuItem onClick={onOpenGenerateAi}>
            <Sparkles className="w-4 h-4 mr-2 text-purple-600" />
            {t('teacher.topicDetail.headerBtnAi')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenCreateQuestion}>
            <Plus className="w-4 h-4 mr-2 text-indigo-600" />
            {t('teacher.topicDetail.headerBtnAdd')}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onOpenEditTopic}>
            <Edit2 className="w-4 h-4 mr-2 text-slate-600" />
            {t('teacher.topicDetail.headerBtnEdit')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem destructive onClick={onOpenDeleteTopic}>
            <Trash2 className="w-4 h-4 mr-2" />
            {t('teacher.topicDetail.headerBtnDelete')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
