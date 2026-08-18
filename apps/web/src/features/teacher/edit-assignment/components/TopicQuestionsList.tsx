import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Star } from 'lucide-react';
import { useTopicQuestions } from '../hooks/useTeacherEditAssignment';
import type { Topic } from '../types';
import { useTranslation } from 'react-i18next';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';

interface TopicQuestionsListProps {
  topic: Topic;
  isTopicChecked: boolean;
  isImplicitlyChecked?: boolean;
  selectedQuestionIds: string[];
  onTopicCheckChange: (topicId: string, checked: boolean, allTopicQIds: string[]) => void;
  onQuestionCheckChange: (questionId: string, checked: boolean, allTopicQIds: string[]) => void;
}

const getQuestionTypeBadgeVariant = (type: string): 'default' | 'secondary' | 'warning' | 'indigo' | 'danger' => {
  switch (type) {
    case 'multiple_choice': return 'default';
    case 'multi_select': return 'indigo';
    case 'true_false': return 'danger';
    case 'fill_blank': return 'warning';
    case 'matching': return 'secondary';
    default: return 'secondary';
  }
};

const getQuestionTypeLabel = (type: string, t: any) => {
  switch (type) {
    case 'multiple_choice': return t('teacher.editAssignment.typeMultipleChoice');
    case 'multi_select': return t('teacher.editAssignment.typeMultiSelect');
    case 'true_false': return t('teacher.editAssignment.typeTrueFalse');
    case 'fill_blank': return t('teacher.editAssignment.typeFillBlank');
    case 'matching': return t('teacher.editAssignment.typeMatching');
    default: return type;
  }
};

export const TopicQuestionsList: React.FC<TopicQuestionsListProps> = ({
  topic,
  isTopicChecked,
  isImplicitlyChecked = false,
  selectedQuestionIds,
  onTopicCheckChange,
  onQuestionCheckChange,
}) => {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const { data: questions, isLoading } = useTopicQuestions(topic.id, expanded);

  const allTopicQIds = questions?.map(q => q.id) || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center p-4 hover:bg-slate-50 transition-colors">
        <div className="mr-3 flex items-center" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            checked={isTopicChecked || isImplicitlyChecked}
            disabled={isImplicitlyChecked}
            onChange={(e) => onTopicCheckChange(topic.id, e.target.checked, allTopicQIds)}
          />
        </div>
        <div
          className="flex-1 cursor-pointer flex justify-between items-center"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">{topic.name}</span>
              {isImplicitlyChecked && (
                <Badge variant="indigo" size="sm">
                  {t('teacher.editAssignment.includedInParent', 'Included')}
                </Badge>
              )}
            </div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">{t('teacher.editAssignment.questionsCount', { count: topic._count?.questions || 0 })}</div>
          </div>
          <div className="text-slate-400 p-1.5 rounded-full hover:bg-slate-100 hover:text-slate-600 transition-colors">
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center text-sm text-slate-500 font-medium">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-500" /> {t('teacher.editAssignment.loading')}
            </div>
          ) : questions && questions.length > 0 ? (
            questions.map(q => {
              const isIndividuallyChecked = selectedQuestionIds.includes(q.id);
              const isChecked = isTopicChecked || isIndividuallyChecked;

              return (
                <div 
                  key={q.id} 
                  className={`flex items-start p-3 rounded-xl border transition-colors shadow-sm bg-white ${
                    isImplicitlyChecked ? 'border-indigo-200 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-300'
                  }`}
                >
                  <div className="mr-3 mt-0.5 flex items-center">
                    <Checkbox
                      checked={isChecked || isImplicitlyChecked}
                      disabled={isImplicitlyChecked}
                      onChange={(e) => onQuestionCheckChange(q.id, e.target.checked, allTopicQIds)}
                    />
                  </div>
                  <div className="flex-1">
                    <span className="text-slate-900 font-medium block mb-2 text-sm">{q.content}</span>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold items-center">
                      <Badge variant={getQuestionTypeBadgeVariant(q.question_type)} size="sm">
                        {getQuestionTypeLabel(q.question_type, t)}
                      </Badge>
                      {topic.name && (
                        <Badge variant="secondary" size="sm">
                          {topic.name}
                        </Badge>
                      )}
                      {q.difficulty !== undefined && q.difficulty !== null && (
                        <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200 text-xs">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-3 h-3 ${q.difficulty! >= star ? 'fill-current' : 'text-amber-300'}`} 
                            />
                          ))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-slate-500 font-medium">{t('teacher.editAssignment.noQuestions')}</p>
          )}
        </div>
      )}
    </div>
  );
};
