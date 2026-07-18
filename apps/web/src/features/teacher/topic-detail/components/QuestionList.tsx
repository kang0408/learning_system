import React from 'react';
import { Search, Plus, Star, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import type { Question } from '../types';
import { useTranslation } from 'react-i18next';

interface QuestionListProps {
  questions: Question[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onEditQuestion: (q: Question) => void;
  onDeleteQuestion: (id: string) => void;
  onOpenCreateQuestion: () => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  searchTerm,
  onSearchChange,
  onEditQuestion,
  onDeleteQuestion,
  onOpenCreateQuestion
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row gap-4 justify-between sm:items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-900 tracking-tight">{t('teacher.topicDetail.listTitle')}</h2>
          <span className="px-2.5 py-1 bg-gray-200 text-gray-700 text-xs font-semibold rounded-full border border-gray-300">
            {questions.length}
          </span>
        </div>
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text" 
            placeholder={t('teacher.topicDetail.listSearchPlaceholder')} 
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-gray-400"
          />
        </div>
      </div>
      
      {questions.length > 0 ? (
        <div className="p-5">
          <ul className="space-y-4">
            {questions.map(q => (
              <li key={q.id} className="p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5">
                  <div className="flex-grow">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md border ${
                        q.question_type === 'multiple_choice' 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {q.question_type === 'multiple_choice' ? t('teacher.topicDetail.listTypeMultipleChoice') : t('teacher.topicDetail.listTypeTrueFalse')}
                      </span>
                      <div className="inline-flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`w-3.5 h-3.5 ${q.difficulty >= star ? 'fill-amber-400 text-amber-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                    
                    <p className="font-semibold text-gray-900 text-base leading-relaxed">{q.content}</p>
                    
                    {q.question_type === 'multiple_choice' && q.answer_options && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                        {q.answer_options.map((opt, i) => (
                          <div key={i} className={`flex items-center p-3 rounded-lg border transition-colors ${opt.is_correct ? 'bg-green-50 border-green-200 text-green-900' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                            <div className={`w-5 h-5 rounded-full border flex items-center justify-center mr-3 flex-shrink-0 ${opt.is_correct ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-transparent'}`}>
                              {opt.is_correct && <CheckCircle2 className="w-3.5 h-3.5" />}
                            </div>
                            <span className={opt.is_correct ? 'font-semibold text-sm' : 'font-medium text-sm'}>{opt.content}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {q.question_type === 'true_false' && q.answer_options && q.answer_options.length > 0 && (
                      <div className="mt-4 p-3 bg-emerald-50 border border-emerald-100 rounded-lg text-sm flex items-center inline-flex">
                        <span className="font-semibold text-emerald-800 mr-2">{t('teacher.topicDetail.listCorrectAnswer')}</span> 
                        <span className="font-bold text-emerald-900">
                          {q.answer_options.find((o) => o.is_correct)?.content}
                        </span>
                      </div>
                    )}
                    
                    {q.explanation && (
                      <div className="mt-4 p-4 bg-indigo-50/50 border border-indigo-100 rounded-lg text-sm">
                        <span className="font-semibold text-indigo-900 block mb-1">{t('teacher.topicDetail.listExplanation')}</span> 
                        <span className="text-gray-700">{q.explanation}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-start mt-2 md:mt-0">
                    <button 
                      onClick={() => onEditQuestion(q)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-indigo-50 hover:text-indigo-600 transition-colors border border-transparent hover:border-indigo-100"
                      title={t('teacher.topicDetail.listBtnEdit')}
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => onDeleteQuestion(q.id)}
                      className="p-2 rounded-lg bg-gray-50 text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border border-transparent hover:border-red-100"
                      title={t('teacher.topicDetail.listBtnDelete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : searchTerm ? (
        <div className="p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-gray-50 rounded-full border border-gray-200 flex items-center justify-center mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('teacher.topicDetail.listNotFoundTitle')}</h3>
          <p className="text-gray-500 text-sm">{t('teacher.topicDetail.listNotFoundDesc')}</p>
        </div>
      ) : (
        <div className="p-16 text-center flex flex-col items-center bg-gray-50/50">
          <div className="w-16 h-16 bg-indigo-50 rounded-full border border-indigo-100 flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-indigo-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-1">{t('teacher.topicDetail.listEmptyTitle')}</h3>
          <p className="text-gray-500 text-sm mb-6">{t('teacher.topicDetail.listEmptyDesc')}</p>
          <button
            onClick={onOpenCreateQuestion}
            className="flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white font-medium rounded-lg border border-slate-800 hover:bg-slate-800 transition-colors text-sm shadow-sm"
          >
            <Plus className="w-4 h-4 mr-2" /> {t('teacher.topicDetail.headerBtnAdd')}
          </button>
        </div>
      )}
    </div>
  );
};
