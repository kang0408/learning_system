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

interface NormalizedPair {
  id: string;
  leftId: string;
  leftText: string;
  rightId: string;
  rightText: string;
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
  const [placedRights, setPlacedRights] = useState<Record<string, string>>({});
  const [selectedBankRightId, setSelectedBankRightId] = useState<string | null>(null);
  const [dragOverLeftId, setDragOverLeftId] = useState<string | null>(null);
  const [dragOverBank, setDragOverBank] = useState<boolean>(false);
  const [draggedRightId, setDraggedRightId] = useState<string | null>(null);

  // Normalize matching pairs to always ensure non-empty unique IDs and texts
  const normalizedPairs = useMemo<NormalizedPair[]>(() => {
    if (question?.question_type !== 'matching' || !question?.metadata?.pairs) return [];
    const raw = Array.isArray(question.metadata.pairs) ? question.metadata.pairs : [];
    return raw.map((p: any, idx: number) => ({
      id: p.id || `pair_${idx}`,
      leftId: p.leftId || `left_${idx}`,
      leftText: p.leftText || '',
      rightId: p.rightId || `right_${idx}`,
      rightText: p.rightText || '',
    }));
  }, [question?.id, question?.metadata, question?.question_type]);

  // Shuffled left items
  const matchingLefts = useMemo(() => {
    return [...normalizedPairs].sort(() => 0.5 - Math.random());
  }, [normalizedPairs]);

  // Shuffled right items for choice bank
  const matchingRights = useMemo(() => {
    return [...normalizedPairs].sort(() => 0.5 - Math.random());
  }, [normalizedPairs]);

  useEffect(() => {
    setFillValue('');
    setLocalSelectedId(null);
    setLocalSelectedIds([]);
    setPlacedRights({});
    setSelectedBankRightId(null);
    setDragOverLeftId(null);
    setDragOverBank(false);
    setDraggedRightId(null);
  }, [question?.id, question?.question_type]);

  const shuffledOptions = useMemo(() => {
    if (!question?.answer_options) return [];
    if (question.question_type === 'multiple_choice') {
      return [...question.answer_options].sort(() => Math.random() - 0.5);
    }
    return question.answer_options;
  }, [question?.id, question?.answer_options, question?.question_type]);

  const unplacedRights = useMemo(() => {
    const placedRightIds = Object.values(placedRights);
    return matchingRights.filter(r => !placedRightIds.includes(r.rightId));
  }, [matchingRights, placedRights]);

  // Helper to place a right item into a left slot
  const placeRightItem = (leftId: string, rightId: string) => {
    if (feedback || submitting) return;
    setPlacedRights(prev => {
      const next = { ...prev };
      // If rightId was already placed in another left slot, remove it from there
      Object.keys(next).forEach(k => {
        if (next[k] === rightId) delete next[k];
      });
      next[leftId] = rightId;
      return next;
    });
    setSelectedBankRightId(null);
    setDragOverLeftId(null);
  };

  // Helper to unplace a right item from any slot
  const unplaceRightItem = (rightId: string) => {
    if (feedback || submitting) return;
    setPlacedRights(prev => {
      const next = { ...prev };
      Object.keys(next).forEach(k => {
        if (next[k] === rightId) delete next[k];
      });
      return next;
    });
    setDragOverBank(false);
  };

  const renderFeedback = () => {
    if (feedback === 'incorrect') {
      return (
        <div className="p-2 md:p-3 mt-1 md:mt-2 bg-red-50 border-4 border-red-600 text-red-700 font-bold text-base md:text-lg uppercase tracking-tight">
          {t('student.quiz.incorrectFeedback')}
        </div>
      );
    }
    if (feedback === 'correct') {
      return (
        <div className="p-2 md:p-3 mt-1 md:mt-2 bg-green-50 border-4 border-green-600 text-green-700 font-bold text-base md:text-lg uppercase tracking-tight">
          {t('student.quiz.correctFeedback')}
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

      {/* Fill in the Blank Question */}
      {question?.question_type === 'fill_blank' && (
        <div className="w-full pb-2 flex flex-col gap-3">
          <input 
            type="text" 
            value={fillValue}
            onChange={(e) => setFillValue(e.target.value)}
            disabled={!!feedback || submitting}
            className="w-full text-lg md:text-xl font-black tracking-tight p-3 md:p-4 border-4 border-zinc-900 focus:outline-none focus:border-indigo-600 transition-colors bg-white"
            placeholder={t('student.quiz.typeAnswer')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && fillValue.trim() && !feedback && !submitting) {
                onSelect({ fillText: fillValue });
              }
            }}
          />
          <button
            disabled={!!feedback || submitting || !fillValue.trim()}
            onClick={() => onSelect({ fillText: fillValue })}
            className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2 shadow-[4px_4px_0_0_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('student.quiz.confirm')}
          </button>
          {renderFeedback()}
        </div>
      )}

      {/* Multi Select Question */}
      {question?.question_type === 'multi_select' && (
        <div className="w-full pb-2 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 md:gap-3">
            {shuffledOptions.map((opt, idx) => {
              const optionKey = opt.id || `opt_${idx}`;
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
                  key={optionKey}
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
                      <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-white" />
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
            className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2 shadow-[4px_4px_0_0_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('student.quiz.confirm')}
          </button>
          {renderFeedback()}
        </div>
      )}

      {/* Multiple Choice / True False Question */}
      {(question?.question_type === 'multiple_choice' || question?.question_type === 'true_false') && (
        <div className="w-full pb-2 flex flex-col gap-3">
          <div className="grid grid-cols-1 gap-2 md:gap-3 w-full">
            {shuffledOptions.map((opt, idx) => {
              const optionKey = opt.id || `opt_${idx}`;
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
                  key={optionKey}
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
            className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2 shadow-[4px_4px_0_0_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('student.quiz.confirm')}
          </button>
          {renderFeedback()}
        </div>
      )}

      {/* Matching Question with Drag & Drop AND Tap/Click-to-place */}
      {question?.question_type === 'matching' && (
        <div className="w-full pb-2 flex flex-col gap-3 md:gap-4">
          <div className="flex flex-col gap-2 md:gap-3 w-full">
            {matchingLefts.map((left, idx) => {
              const leftKey = left.leftId || `left_${idx}`;
              const placedRightId = placedRights[left.leftId];
              const placedRight = matchingRights.find(r => r.rightId === placedRightId);
              
              let containerClass = "flex items-stretch border-2 border-zinc-900 bg-zinc-50 rounded-lg overflow-hidden transition-all shadow-[2px_2px_0_0_rgba(24,24,27,1)]";
              let rightDropClass = "w-[50%] p-2 flex flex-col items-center justify-center border-l-2 border-zinc-900 min-h-[56px] bg-zinc-100 transition-all relative";
              
              if (dragOverLeftId === left.leftId || (selectedBankRightId && !placedRight && !feedback && !submitting)) {
                rightDropClass += " bg-indigo-50 border-indigo-600";
                containerClass += " border-indigo-600 ring-2 ring-indigo-300";
              }
              
              if (feedback) {
                const isCorrectPair = normalizedPairs.some(
                  p => p.leftId === left.leftId && p.rightId === placedRightId
                );
                if (isCorrectPair) {
                  containerClass = "flex items-stretch border-2 border-green-600 bg-green-50 rounded-lg overflow-hidden";
                  rightDropClass = "w-[50%] p-2 flex flex-col items-center justify-center border-l-2 border-green-600 min-h-[56px] bg-green-100 relative";
                } else {
                  containerClass = "flex items-stretch border-2 border-red-600 bg-red-50 rounded-lg overflow-hidden";
                  rightDropClass = "w-[50%] p-2 flex flex-col items-center justify-center border-l-2 border-red-600 min-h-[56px] bg-red-100 relative";
                }
              }

              return (
                <div key={leftKey} className={containerClass}>
                  <div className="w-[50%] p-2 md:p-3 text-xs md:text-sm font-bold text-zinc-900 flex items-center leading-snug">
                    {left.leftText}
                  </div>
                  <div 
                    className={rightDropClass}
                    onDragOver={(e) => { 
                      e.preventDefault(); 
                      e.dataTransfer.dropEffect = 'move';
                      if (!feedback && !submitting) setDragOverLeftId(left.leftId); 
                    }}
                    onDragLeave={() => { 
                      if (dragOverLeftId === left.leftId) setDragOverLeftId(null); 
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (feedback || submitting) return;
                      const rightId = e.dataTransfer.getData('text/plain') || draggedRightId;
                      if (rightId) {
                        placeRightItem(left.leftId, rightId);
                      }
                      setDraggedRightId(null);
                      setDragOverLeftId(null);
                    }}
                    onClick={() => {
                      if (feedback || submitting) return;
                      if (selectedBankRightId) {
                        placeRightItem(left.leftId, selectedBankRightId);
                      }
                    }}
                  >
                    {placedRight ? (
                      <div 
                        draggable={!feedback && !submitting}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', placedRight.rightId);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedRightId(placedRight.rightId);
                        }}
                        onDragEnd={() => {
                          setDraggedRightId(null);
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!feedback && !submitting) {
                            unplaceRightItem(placedRight.rightId);
                          }
                        }}
                        title={!feedback && !submitting ? t('student.quiz.clickToUnplace', 'Nhấp để gỡ thẻ') : undefined}
                        className={`bg-white border-2 border-zinc-900 rounded-md p-1.5 md:p-2 w-full text-center text-xs md:text-sm font-bold shadow-sm transition-all ${
                          !feedback && !submitting 
                            ? 'cursor-grab active:cursor-grabbing hover:border-indigo-600 hover:bg-indigo-50 hover:text-indigo-900 hover:scale-[1.02]' 
                            : 'cursor-default'
                        }`}
                      >
                        {placedRight.rightText}
                      </div>
                    ) : (
                      <span className={`text-[10px] md:text-xs font-medium italic text-center px-1 transition-colors ${
                        selectedBankRightId ? 'text-indigo-600 font-bold' : 'text-zinc-400'
                      }`}>
                        {selectedBankRightId ? t('student.quiz.clickToPlace', 'Nhấp vào đây để gắn') : t('student.quiz.dragDropHere')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Choice Bank */}
          {!feedback && (
            <div className="mt-1 md:mt-2">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                  {t('student.quiz.choiceList')}
                </h3>
                <span className="text-[11px] text-zinc-500 font-medium italic">
                  (Kéo thả hoặc nhấp chọn thẻ rồi nhấp vào ô tương ứng)
                </span>
              </div>
              <div 
                className={`p-3 md:p-4 bg-zinc-100 rounded-lg border-2 border-dashed transition-all min-h-[64px] flex flex-wrap gap-2 items-center justify-center ${
                  dragOverBank ? 'border-indigo-600 bg-indigo-50' : 'border-zinc-300'
                }`}
                onDragOver={(e) => { 
                  e.preventDefault(); 
                  e.dataTransfer.dropEffect = 'move';
                  if (!submitting) setDragOverBank(true); 
                }}
                onDragLeave={() => setDragOverBank(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  if (submitting) return;
                  const rightId = e.dataTransfer.getData('text/plain') || draggedRightId;
                  if (rightId) {
                    unplaceRightItem(rightId);
                  }
                  setDraggedRightId(null);
                  setDragOverBank(false);
                }}
              >
                {unplacedRights.length === 0 ? (
                  <span className="text-zinc-400 font-medium text-xs">
                    {t('student.quiz.allPlaced')}
                  </span>
                ) : (
                  unplacedRights.map((right, idx) => {
                    const rightKey = right.rightId || `right_${idx}`;
                    const isSelected = selectedBankRightId === right.rightId;
                    return (
                      <div 
                        key={rightKey}
                        draggable={!submitting}
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', right.rightId);
                          e.dataTransfer.effectAllowed = 'move';
                          setDraggedRightId(right.rightId);
                        }}
                        onDragEnd={() => {
                          setDraggedRightId(null);
                        }}
                        onClick={() => {
                          if (submitting) return;
                          setSelectedBankRightId(prev => prev === right.rightId ? null : right.rightId);
                        }}
                        className={`bg-white border-2 rounded-md px-3 py-1.5 text-xs md:text-sm font-bold transition-all select-none ${
                          isSelected 
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 ring-2 ring-indigo-400 shadow-none scale-105' 
                            : 'border-zinc-900 text-zinc-900 shadow-[2px_2px_0_0_rgba(24,24,27,1)] hover:border-indigo-600 hover:translate-y-[-1px]'
                        } ${!submitting ? 'cursor-grab active:cursor-grabbing' : ''}`}
                      >
                        {right.rightText}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          <button
            disabled={!!feedback || submitting || Object.keys(placedRights).length !== matchingLefts.length}
            onClick={() => {
              const pairs = Object.entries(placedRights).map(([leftId, rightId]) => {
                const leftItem = normalizedPairs.find(p => p.leftId === leftId);
                const rightItem = normalizedPairs.find(p => p.rightId === rightId);
                return {
                  leftId,
                  rightId,
                  leftText: leftItem?.leftText || '',
                  rightText: rightItem?.rightText || '',
                };
              });
              onSelect({ matchingPairs: pairs });
            }}
            className="w-full p-3 md:p-4 font-black text-base md:text-lg uppercase tracking-tight transition-colors border-4 border-zinc-900 bg-zinc-900 text-white hover:bg-indigo-600 hover:border-indigo-600 disabled:opacity-50 flex items-center justify-center mt-1 md:mt-2 shadow-[4px_4px_0_0_rgba(24,24,27,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : t('student.quiz.confirm')}
          </button>
          {renderFeedback()}
        </div>
      )}
    </div>
  );
};
