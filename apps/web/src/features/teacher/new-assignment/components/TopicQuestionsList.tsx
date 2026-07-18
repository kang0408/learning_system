import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Loader2, Star } from 'lucide-react';
import { useTopicQuestions } from '../hooks/useTeacherNewAssignment';
import type { Topic } from '../types';
import { useTranslation } from 'react-i18next';

interface TopicQuestionsListProps {
  topic: Topic;
  isTopicChecked: boolean;
  isImplicitlyChecked?: boolean;
  selectedQuestionIds: string[];
  onTopicCheckChange: (topicId: string, checked: boolean, allTopicQIds: string[]) => void;
  onQuestionCheckChange: (questionId: string, checked: boolean, allTopicQIds: string[]) => void;
}

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
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden transition-all duration-200 hover:shadow-sm">
      <div className="flex items-center p-4 hover:bg-gray-50 transition-colors">
        <div className="mr-4" onClick={(e) => e.stopPropagation()}>
          <input
            type="checkbox"
            className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
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
              <span className="font-semibold text-gray-900">{topic.name}</span>
              {isImplicitlyChecked && (
                <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-500 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100">
                  {t('teacher.newAssignment.includedInParent', 'Included')}
                </span>
              )}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">{t('teacher.newAssignment.questionsCount', { count: topic._count?.questions || 0 })}</div>
          </div>
          <div className="text-gray-400 p-1.5 rounded-full hover:bg-gray-100 hover:text-gray-600 transition-colors">
            {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 bg-gray-50/50 p-4 space-y-3">
          {isLoading ? (
            <div className="flex items-center text-sm text-gray-500">
              <Loader2 className="w-4 h-4 mr-2 animate-spin text-indigo-500" /> {t('teacher.newAssignment.loading')}
            </div>
          ) : questions && questions.length > 0 ? (
            questions.map(q => {
              const isIndividuallyChecked = selectedQuestionIds.includes(q.id);
              const isChecked = isTopicChecked || isIndividuallyChecked;

              return (
                <label key={q.id} className={`flex items-start cursor-pointer group bg-white p-3 rounded-xl border transition-colors shadow-sm ${isImplicitlyChecked ? 'border-indigo-200 bg-indigo-50/10' : 'border-gray-200 hover:border-indigo-300'}`}>
                  <input
                    type="checkbox"
                    className="mt-0.5 mr-3 w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
                    checked={isChecked || isImplicitlyChecked}
                    disabled={isImplicitlyChecked}
                    onChange={(e) => onQuestionCheckChange(q.id, e.target.checked, allTopicQIds)}
                  />
                  <div className="flex-1">
                    <span className="text-gray-900 font-medium block mb-2 text-sm">{q.content}</span>
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className={`px-2 py-0.5 rounded-md ${
                        q.question_type === 'multiple_choice' 
                          ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                          : 'bg-pink-50 text-pink-700 border border-pink-200'
                      }`}>
                        {q.question_type === 'multiple_choice' ? t('teacher.newAssignment.typeMultipleChoice') : t('teacher.newAssignment.typeTrueFalse')}
                      </span>
                      {topic.name && (
                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                          {topic.name}
                        </span>
                      )}
                      {q.difficulty !== undefined && q.difficulty !== null && (
                        <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200">
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
                </label>
              );
            })
          ) : (
            <p className="text-sm text-gray-500">{t('teacher.newAssignment.noQuestions')}</p>
          )}
        </div>
      )}
    </div>
  );
};
