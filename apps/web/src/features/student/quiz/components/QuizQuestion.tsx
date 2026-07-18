import React, { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import type { Question } from '../types';

interface QuizQuestionProps {
  question: Question;
  selectedOptionId: string | null;
  correctAnswerId: string | null;
  selectedOptionIds?: string[];
  correctAnswerIds?: string[];
  feedback: 'correct' | 'incorrect' | null;
  submitting: boolean;
  onSelect: (payload: any) => void;
}

export const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  selectedOptionId,
  correctAnswerId,
  selectedOptionIds = [],
  correctAnswerIds = [],
  feedback,
  submitting,
  onSelect
}) => {
  const { t } = useTranslation();
  const [fillValue, setFillValue] = useState('');
  
  // For multiple_choice / true_false
  const [localSelectedId, setLocalSelectedId] = useState<string | null>(null);
  
  // For multi_select
  const [localSelectedIds, setLocalSelectedIds] = useState<string[]>([]);
  
  // For matching
  const [matchingRights, setMatchingRights] = useState<any[]>([]);
  const [placedRights, setPlacedRights] = useState<Record<string, string>>({});
  const [dragOverLeftId, setDragOverLeftId] = useState<string | null>(null);
  const [dragOverBank, setDragOverBank] = useState<boolean>(false);

  useEffect(() => {
    setFillValue('');
    setLocalSelectedId(null);
    setLocalSelectedIds([]);
    setPlacedRights({});
    setDragOverLeftId(null);
    setDragOverBank(false);
    
    if (question?.question_type === 'matching' && question?.metadata?.pairs) {
      setMatchingRights([...question.metadata.pairs].sort(() => Math.random() - 0.5));
    } else {
      setMatchingRights([]);
    }
  }, [question?.id, question?.metadata?.pairs, question?.question_type]);

  const shuffledOptions = useMemo(() => {
    if (!question?.answer_options) return [];
    if (question.question_type === 'multiple_choice') {
      return [...question.answer_options].sort(() => Math.random() - 0.5);
    }
    return question.answer_options;
  }, [question?.id, question?.answer_options, question?.question_type]);

  const matchingLefts = useMemo(() => {
    if (question?.question_type !== 'matching' || !question?.metadata?.pairs) return [];
    return [...question.metadata.pairs].sort(() => Math.random() - 0.5);
  }, [question?.id, question?.metadata?.pairs, question?.question_type]);

  const unplacedRights = useMemo(() => {
    return matchingRights.filter(r => !Object.values(placedRights).includes(r.rightId));
  }, [matchingRights, placedRights]);

  const renderFeedback = () => {
    if (feedback === 'incorrect') {
      return (
        <div className="p-2 md:p-3 mt-1 md:mt-2 bg-red-50 border-4 border-red-600 text-red-700 font-bold text-base md:text-lg uppercase tracking-tight">
          Đáp án không chính xác.
        </div>
      );
    }
    if (feedback === 'correct') {
      return (
        <div className="p-2 md:p-3 mt-1 md:mt-2 bg-green-50 border-4 border-green-600 text-green-700 font-bold text-base md:text-lg uppercase tracking-tight">
          Chính xác!
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 md:px-8 flex flex-col justify-start md:justify-center animate-in slide-in-from-right-8 fade-in duration-500 pb-8 pt-4 overflow-y-auto">
      {question?.topic && (
        <div className="mb-2 md:mb-3">
          <span className="font-bold uppercase tracking-[0.2em] text-indigo-600 text-[10px] md:text-xs bg-indigo-50 px-2 py-1 md:px-3 md:py-1.5 border-2 border-indigo-600">
            {t('student.quiz.topic')} {question.topic}
          </span>
        </div>
      )}

      <h2 className="text-base md:text-lg lg:text-xl font-bold text-zinc-900 mb-4 md:mb-6 leading-[1.5] tracking-tight w-full max-w-4xl border-l-4 border-indigo-600 pl-3 md:pl-4 shrink-0">
        {question?.content}
      </h2>

      {question?.question_type === 'fill_blank' && (
        <div className="w-full pb-2 flex flex-col gap-3">
           <input 
             type="text" 
             value={fillValue}
             onChange={(e) => setFillValue(e.target.value)}
             disabled={!!feedback || submitting}
             className="w-full text-lg md:text-xl font-black tracking-tight p-3 md:p-4 border-4 border-zinc-900 focus:outline-none focus:border-indigo-600 transition-colors bg-white"
             placeholder="Nhập câu trả lời của bạn..."
             onKeyDown={(e) => {
               if (e.key === 'Enter' && fillValue.trim() && !feedback && !submitting) onSelect({ fillText: fillValue });
             }}
           />
           <button
             disabled={!!feedback || submitting || !fillValue.trim()}
             onClick={() => onSelect({ fillText: fillValue })}
             className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2"
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN"}
           </button>
           {renderFeedback()}
        </div>
      )}

      {question?.question_type === 'multi_select' && (
        <div className="w-full pb-2 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            {shuffledOptions.map((opt) => {
              const isSelected = feedback || submitting ? selectedOptionIds.includes(opt.id) : localSelectedIds.includes(opt.id);
              const isCorrect = correctAnswerIds.includes(opt.id);

              let btnClass = 'border-4 border-zinc-900 bg-white text-zinc-900 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white';

              if (isSelected && !feedback && !submitting) {
                btnClass = 'border-4 border-indigo-600 bg-indigo-50 text-indigo-900';
              }

              if (submitting && !feedback && isSelected) {
                btnClass = 'border-4 border-indigo-600 bg-indigo-600 text-white';
              }

              if (feedback) {
                if (isCorrect) {
                  btnClass = 'border-4 border-green-600 bg-green-600 text-white';
                } else if (isSelected) {
                  btnClass = 'border-4 border-red-600 bg-red-600 text-white line-through decoration-4';
                } else {
                  btnClass = 'border-4 border-zinc-200 bg-white text-zinc-300 opacity-50';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={!!feedback || submitting}
                  onClick={() => {
                    if (localSelectedIds.includes(opt.id)) {
                      setLocalSelectedIds(prev => prev.filter(id => id !== opt.id));
                    } else {
                      setLocalSelectedIds(prev => [...prev, opt.id]);
                    }
                  }}
                  className={`flex items-center p-2 md:p-3 text-left font-bold text-sm md:text-base transition-colors ${btnClass}`}
                >
                  <div className={`w-5 h-5 md:w-6 md:h-6 border-[3px] flex items-center justify-center mr-2 md:mr-3 shrink-0 transition-colors ${
                    isSelected ? 'border-current bg-current' : 'border-zinc-900'
                  }`}>
                    {isSelected && (
                      <div className={`w-2 h-2 md:w-2.5 md:h-2.5 bg-white`} />
                    )}
                  </div>
                  <span>{opt.content}</span>
                </button>
              );
            })}
          </div>
          <button
             disabled={!!feedback || submitting || localSelectedIds.length === 0}
             onClick={() => onSelect({ optIds: localSelectedIds })}
             className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2"
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN"}
           </button>
           {renderFeedback()}
        </div>
      )}

      {(question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') && (
        <div className="w-full pb-2 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 md:gap-3 w-full">
            {shuffledOptions.map((opt) => {
              const isSelected = feedback || submitting ? opt.id === selectedOptionId : opt.id === localSelectedId;
              const isCorrect = feedback ? opt.id === correctAnswerId : false;

              let btnClass = 'border-4 border-zinc-900 bg-white text-zinc-900 hover:bg-indigo-600 hover:border-indigo-600 hover:text-white';

              if (isSelected && !feedback && !submitting) {
                btnClass = 'border-4 border-indigo-600 bg-indigo-50 text-indigo-900';
              }

              if (submitting && !feedback && isSelected) {
                btnClass = 'border-4 border-indigo-600 bg-indigo-600 text-white';
              }

              if (feedback) {
                if (isCorrect) {
                  btnClass = 'border-4 border-green-600 bg-green-600 text-white';
                } else if (isSelected) {
                  btnClass = 'border-4 border-red-600 bg-red-600 text-white line-through decoration-4';
                } else {
                  btnClass = 'border-4 border-zinc-200 bg-white text-zinc-300 opacity-50';
                }
              }

              return (
                <button
                  key={opt.id}
                  disabled={!!feedback || submitting}
                  onClick={() => setLocalSelectedId(opt.id)}
                  className={`flex items-center justify-between p-2 md:p-3 text-left font-bold text-sm md:text-base transition-colors ${btnClass}`}
                >
                  <span>{opt.content}</span>
                </button>
              );
            })}
          </div>
          <button
             disabled={!!feedback || submitting || !localSelectedId}
             onClick={() => onSelect({ optId: localSelectedId })}
             className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2"
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN"}
           </button>
           {renderFeedback()}
        </div>
      )}

      {question?.question_type === 'matching' && (
        <div className="w-full pb-2 flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col gap-2 md:gap-3 w-full">
            {matchingLefts.map((left) => {
              const placedRightId = placedRights[left.leftId];
              const placedRight = matchingRights.find(r => r.rightId === placedRightId);
              
              let containerClass = "flex items-stretch border-2 border-zinc-200 bg-zinc-50 rounded-lg overflow-hidden transition-colors";
              let rightDropClass = "w-[45%] md:w-1/2 p-1.5 md:p-2 flex flex-col items-center justify-center border-l-2 border-zinc-200 min-h-[50px] bg-zinc-100 transition-colors relative";
              
              if (dragOverLeftId === left.leftId) {
                 rightDropClass += " bg-indigo-50 border-indigo-300";
                 containerClass += " border-indigo-300 ring-2 ring-indigo-100";
              }
              
              if (feedback) {
                 const isCorrectPair = question.metadata?.pairs?.find((p: any) => p.leftId === left.leftId && p.rightId === placedRightId);
                 if (isCorrectPair) {
                    containerClass = "flex items-stretch border-2 border-green-500 bg-green-50 rounded-lg overflow-hidden";
                    rightDropClass = "w-[45%] md:w-1/2 p-1.5 md:p-2 flex flex-col items-center justify-center border-l-2 border-green-500 min-h-[50px] bg-green-100 relative";
                 } else {
                    containerClass = "flex items-stretch border-2 border-red-500 bg-red-50 rounded-lg overflow-hidden";
                    rightDropClass = "w-[45%] md:w-1/2 p-1.5 md:p-2 flex flex-col items-center justify-center border-l-2 border-red-500 min-h-[50px] bg-red-100 relative";
                 }
              }

              return (
                 <div key={left.leftId} className={containerClass}>
                    <div className="w-[55%] md:w-1/2 p-2 md:p-3 text-xs md:text-sm font-semibold text-zinc-700 flex items-center leading-snug">
                       {left.leftText}
                    </div>
                    <div 
                       className={rightDropClass}
                       onDragOver={(e) => { 
                         e.preventDefault(); 
                         if (!feedback && !submitting) setDragOverLeftId(left.leftId); 
                       }}
                       onDragLeave={() => { 
                         if (dragOverLeftId === left.leftId) setDragOverLeftId(null); 
                       }}
                       onDrop={(e) => {
                          e.preventDefault();
                          if (feedback || submitting) return;
                          const rightId = e.dataTransfer.getData('text/plain');
                          if (rightId) {
                             setPlacedRights(prev => {
                                const next = { ...prev };
                                Object.keys(next).forEach(k => {
                                   if (next[k] === rightId) delete next[k];
                                });
                                next[left.leftId] = rightId;
                                return next;
                             });
                          }
                          setDragOverLeftId(null);
                       }}
                    >
                       {placedRight ? (
                          <div 
                            draggable={!feedback && !submitting}
                            onDragStart={(e) => {
                               e.dataTransfer.setData('text/plain', placedRight.rightId);
                               setTimeout(() => {
                                 if (e.target && (e.target as HTMLElement).classList) {
                                    (e.target as HTMLElement).classList.add('opacity-50');
                                 }
                               }, 0);
                            }}
                            onDragEnd={(e) => {
                               if (e.target && (e.target as HTMLElement).classList) {
                                  (e.target as HTMLElement).classList.remove('opacity-50');
                               }
                            }}
                            className={`bg-white border-2 border-zinc-900 rounded-md p-1.5 md:p-2 w-full text-center text-xs md:text-sm font-bold shadow-sm transition-colors ${!feedback && !submitting ? 'cursor-grab active:cursor-grabbing hover:border-indigo-600' : 'cursor-default'}`}
                          >
                             {placedRight.rightText}
                          </div>
                       ) : (
                          <span className="text-[10px] md:text-xs text-zinc-400 font-medium italic text-center px-1">
                             Kéo thả vào đây
                          </span>
                       )}
                    </div>
                 </div>
              );
            })}
          </div>

          {!feedback && (
            <div className="mt-1 md:mt-2">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-1.5">Danh sách lựa chọn</h3>
              <div 
                 className="p-3 md:p-4 bg-zinc-100 rounded-lg border-2 border-dashed border-zinc-300 min-h-[60px] md:min-h-[80px] flex flex-wrap gap-2 items-center justify-center transition-colors"
                 onDragOver={(e) => { 
                   e.preventDefault(); 
                   if (!submitting) setDragOverBank(true); 
                 }}
                 onDragLeave={() => setDragOverBank(false)}
                 onDrop={(e) => {
                    e.preventDefault();
                    if (submitting) return;
                    const rightId = e.dataTransfer.getData('text/plain');
                    if (rightId) {
                       setPlacedRights(prev => {
                          const next = { ...prev };
                          Object.keys(next).forEach(k => {
                             if (next[k] === rightId) delete next[k];
                          });
                          return next;
                       });
                    }
                    setDragOverBank(false);
                 }}
                 style={{ borderColor: dragOverBank ? '#6366f1' : undefined, backgroundColor: dragOverBank ? '#eef2ff' : undefined }}
              >
                 {unplacedRights.length === 0 ? (
                    <span className="text-zinc-400 font-medium text-xs">Bạn đã đặt tất cả lựa chọn</span>
                 ) : (
                    unplacedRights.map(right => (
                       <div 
                          key={right.rightId}
                          draggable={!submitting}
                          onDragStart={(e) => {
                             e.dataTransfer.setData('text/plain', right.rightId);
                             setTimeout(() => {
                               if (e.target && (e.target as HTMLElement).classList) {
                                  (e.target as HTMLElement).classList.add('opacity-50');
                               }
                             }, 0);
                          }}
                          onDragEnd={(e) => {
                             if (e.target && (e.target as HTMLElement).classList) {
                                (e.target as HTMLElement).classList.remove('opacity-50');
                             }
                          }}
                          className={`bg-white border-2 border-zinc-900 rounded-md px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-bold shadow-[2px_2px_0px_rgba(24,24,27,1)] transition-all ${!submitting ? 'cursor-grab active:cursor-grabbing hover:translate-y-[1px] hover:translate-x-[1px] hover:shadow-none hover:border-indigo-600' : ''}`}
                       >
                          {right.rightText}
                       </div>
                    ))
                 )}
              </div>
            </div>
          )}

          <button
             disabled={!!feedback || submitting || Object.keys(placedRights).length !== matchingLefts.length}
             onClick={() => {
               const pairs = Object.entries(placedRights).map(([leftId, rightId]) => ({ leftId, rightId }));
               onSelect({ matchingPairs: pairs });
             }}
             className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2"
           >
             {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : "XÁC NHẬN"}
           </button>
           {renderFeedback()}
        </div>
      )}
    </div>
  );
};

