import React, { useState, useEffect } from 'react';
import { Loader2, Save, Star, X } from 'lucide-react';
import { useSaveQuestion } from '../hooks/useTeacherTopicDetail';
import type { Topic, Question } from '../types';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/Select';
import { TreeSelect } from '@/components/ui/TreeSelect';
import type { TreeSelectOption } from '@/components/ui/TreeSelect';

interface SaveQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
  initialTopicId?: string;
  editingQuestion?: Question | null;
}

export const SaveQuestionModal: React.FC<SaveQuestionModalProps> = ({ 
  isOpen, 
  onClose, 
  topics,
  initialTopicId,
  editingQuestion 
}) => {
  const { t } = useTranslation();
  const { mutateAsync: saveQuestion, isPending } = useSaveQuestion();
  
  const [newType, setNewType] = useState('multiple_choice');
  const [newContent, setNewContent] = useState('');
  const [newOptions, setNewOptions] = useState(['', '', '', '']);
  const [newCorrectOption, setNewCorrectOption] = useState(0);
  const [newMultiCorrectOptions, setNewMultiCorrectOptions] = useState([false, false, false, false]);
  const [isTrueStatement, setIsTrueStatement] = useState(true);
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [newDifficulty, setNewDifficulty] = useState(3);
  const [newExplanation, setNewExplanation] = useState('');
  const [fillBlankAnswer, setFillBlankAnswer] = useState('');
  const [newMatchingPairs, setNewMatchingPairs] = useState([
    { leftText: '', rightText: '' },
    { leftText: '', rightText: '' }
  ]);

  useEffect(() => {
    if (isOpen) {
      if (editingQuestion) {
        setNewType(editingQuestion.question_type);
        setNewContent(editingQuestion.content);
        setNewExplanation(editingQuestion.explanation || '');
        setNewDifficulty(editingQuestion.difficulty);
        setSelectedTopicId(editingQuestion.topic_id || initialTopicId || '');
        
        if (editingQuestion.question_type === 'multiple_choice') {
          const opts = editingQuestion.answer_options || [];
          setNewOptions([
            opts[0]?.content || '',
            opts[1]?.content || '',
            opts[2]?.content || '',
            opts[3]?.content || ''
          ]);
          const correctIdx = opts.findIndex((o) => o.is_correct);
          setNewCorrectOption(correctIdx >= 0 ? correctIdx : 0);
        } else if (editingQuestion.question_type === 'multi_select') {
          const opts = editingQuestion.answer_options || [];
          setNewOptions([
            opts[0]?.content || '',
            opts[1]?.content || '',
            opts[2]?.content || '',
            opts[3]?.content || ''
          ]);
          setNewMultiCorrectOptions([
            opts[0]?.is_correct || false,
            opts[1]?.is_correct || false,
            opts[2]?.is_correct || false,
            opts[3]?.is_correct || false
          ]);
        } else if (editingQuestion.question_type === 'true_false') {
          const opts = editingQuestion.answer_options || [];
          const correctOpt = opts.find((o) => o.is_correct);
          setIsTrueStatement(correctOpt?.content === t('teacher.topicDetail.saveModalTrue') || correctOpt?.content === 'Đúng');
        } else if (editingQuestion.question_type === 'fill_blank') {
          const opts = editingQuestion.answer_options || [];
          setFillBlankAnswer(opts[0]?.content || '');
        } else if (editingQuestion.question_type === 'matching') {
          const pairs = editingQuestion.metadata?.pairs || [];
          setNewMatchingPairs(pairs.length > 0 ? pairs.map((p: any) => ({ leftText: p.leftText, rightText: p.rightText })) : [
            { leftText: '', rightText: '' },
            { leftText: '', rightText: '' }
          ]);
        }
      } else {
        setNewType('multiple_choice');
        setNewContent('');
        setNewExplanation('');
        setNewDifficulty(3);
        setSelectedTopicId(initialTopicId || topics[0]?.id || '');
        setNewOptions(['', '', '', '']);
        setNewCorrectOption(0);
        setNewMultiCorrectOptions([false, false, false, false]);
        setIsTrueStatement(true);
        setFillBlankAnswer('');
        setNewMatchingPairs([
          { leftText: '', rightText: '' },
          { leftText: '', rightText: '' }
        ]);
      }
    }
  }, [isOpen, editingQuestion, initialTopicId, topics]);

  if (!isOpen) return null;

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    let answer_options = undefined;
    let metadata = undefined;
    if (newType === 'multiple_choice') {
      answer_options = newOptions.map((opt, index) => ({
        content: opt,
        is_correct: index === newCorrectOption,
        order_index: index
      }));
    } else if (newType === 'multi_select') {
      answer_options = newOptions.map((opt, index) => ({
        content: opt,
        is_correct: newMultiCorrectOptions[index],
        order_index: index
      }));
    } else if (newType === 'true_false') {
      answer_options = [
        { content: t('teacher.topicDetail.saveModalTrue'), is_correct: isTrueStatement, order_index: 0 },
        { content: t('teacher.topicDetail.saveModalFalse'), is_correct: !isTrueStatement, order_index: 1 }
      ];
    } else if (newType === 'fill_blank') {
      answer_options = [
        { content: fillBlankAnswer, is_correct: true, order_index: 0 }
      ];
    } else if (newType === 'matching') {
      metadata = {
        pairs: newMatchingPairs.filter(p => p.leftText.trim() && p.rightText.trim()).map(p => ({
          leftId: crypto.randomUUID(),
          leftText: p.leftText,
          rightId: crypto.randomUUID(),
          rightText: p.rightText
        }))
      };
    }

    try {
      await saveQuestion({
        questionId: editingQuestion?.id,
        payload: {
          topic_id: selectedTopicId || undefined,
          question_type: newType,
          content: newContent,
          difficulty: newDifficulty,
          explanation: newExplanation,
          answer_options,
          metadata
        }
      });
      
      toast.success(editingQuestion ? t('teacher.topicDetail.saveModalUpdateSuccess') : t('teacher.topicDetail.saveModalAddSuccess'));
      onClose();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.topicDetail.saveModalError'));
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white max-w-2xl w-full rounded-2xl shadow-xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              {editingQuestion ? t('teacher.topicDetail.saveModalEditTitle') : t('teacher.topicDetail.saveModalAddTitle')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{t('teacher.topicDetail.saveModalDesc')}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="p-6 space-y-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">{t('teacher.topicDetail.saveModalTopicLabel')} <span className="text-red-500">*</span></label>
                <TreeSelect
                  value={selectedTopicId}
                  onChange={(val) => setSelectedTopicId(val)}
                  options={[
                    ...(!topics.some(t => t.name === 'Chưa phân loại' || t.name === 'Uncategorized') 
                      ? [{ label: t('teacher.topicDetail.saveModalTopicUncategorized'), value: '' }] 
                      : []),
                    ...topics.map(function mapTopic(t: Topic): TreeSelectOption {
                      return {
                        label: `${t.name} ${t.code ? `(${t.code})` : ''}`.trim(),
                        value: t.id,
                        children: t.children ? t.children.map(mapTopic) : undefined
                      };
                    })
                  ]}
                  placeholder={t('teacher.topicDetail.saveModalTopicUncategorized')}
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-sm font-semibold text-gray-700">{t('teacher.topicDetail.saveModalTypeLabel')}</label>
                <Select
                  value={newType}
                  onChange={(val) => setNewType(val)}
                  options={[
                    { label: t('teacher.topicDetail.saveModalTypeMultipleChoice'), value: 'multiple_choice' },
                    { label: t('teacher.topicDetail.saveModalTypeMultiSelect'), value: 'multi_select' },
                    { label: t('teacher.topicDetail.saveModalTypeTrueFalse'), value: 'true_false' },
                    { label: t('teacher.topicDetail.saveModalTypeFillBlank'), value: 'fill_blank' },
                    { label: t('teacher.topicDetail.saveModalTypeMatching'), value: 'matching' }
                  ]}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('teacher.topicDetail.saveModalContentLabel')} <span className="text-red-500">*</span></label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                rows={4}
                placeholder={t('teacher.topicDetail.saveModalContentPlaceholder')}
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('teacher.topicDetail.saveModalExplanationLabel')}</label>
              <textarea
                value={newExplanation}
                onChange={(e) => setNewExplanation(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
                rows={2}
                placeholder={t('teacher.topicDetail.saveModalExplanationPlaceholder')}
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-gray-700">{t('teacher.topicDetail.saveModalDiffLabel')}</label>
              <div className="flex items-center gap-1 bg-gray-50 w-fit px-4 py-2.5 rounded-xl border border-gray-200">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewDifficulty(star)}
                    className={`p-1 transition-all duration-200 transform hover:scale-110 ${newDifficulty >= star ? 'text-amber-400' : 'text-gray-300 hover:text-amber-200'}`}
                  >
                    <Star className="w-6 h-6 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
              {newType === 'multiple_choice' ? (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-4">{t('teacher.topicDetail.saveModalOptionsLabelMultiple')}</label>
                  <div className="space-y-3">
                    {newOptions.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${newCorrectOption === i ? 'border-indigo-300 bg-white shadow-sm' : 'border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200'}`}>
                        <div className="flex-shrink-0">
                          <input
                            type="radio"
                            name="correct_option"
                            checked={newCorrectOption === i}
                            onChange={() => setNewCorrectOption(i)}
                            className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-grow px-3 py-2 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                          placeholder={t('teacher.topicDetail.saveModalOptionPlaceholder', { index: i + 1 })}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : newType === 'multi_select' ? (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-4">{t('teacher.topicDetail.saveModalOptionsLabelMultiSelect')}</label>
                  <div className="space-y-3">
                    {newOptions.map((opt, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${newMultiCorrectOptions[i] ? 'border-indigo-300 bg-white shadow-sm' : 'border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200'}`}>
                        <div className="flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={newMultiCorrectOptions[i]}
                            onChange={(e) => {
                              const newArr = [...newMultiCorrectOptions];
                              newArr[i] = e.target.checked;
                              setNewMultiCorrectOptions(newArr);
                            }}
                            className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                        </div>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleOptionChange(i, e.target.value)}
                          className="flex-grow px-3 py-2 border-0 bg-transparent text-sm focus:outline-none focus:ring-0"
                          placeholder={t('teacher.topicDetail.saveModalOptionPlaceholder', { index: i + 1 })}
                          required
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : newType === 'true_false' ? (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-4">{t('teacher.topicDetail.saveModalOptionsLabelTrueFalse')}</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setIsTrueStatement(true)}
                      className={`flex-1 py-3 px-5 rounded-xl border font-semibold transition-all ${isTrueStatement ? 'border-green-500 bg-green-50 text-green-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                      {t('teacher.topicDetail.saveModalTrue')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsTrueStatement(false)}
                      className={`flex-1 py-3 px-5 rounded-xl border font-semibold transition-all ${!isTrueStatement ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'}`}
                    >
                      {t('teacher.topicDetail.saveModalFalse')}
                    </button>
                  </div>
                </div>
              ) : newType === 'fill_blank' ? (
                <div>
                  <label className="block text-sm font-semibold text-indigo-900 mb-4">{t('teacher.topicDetail.saveModalOptionsLabelFillBlank')}</label>
                  <input
                    type="text"
                    value={fillBlankAnswer}
                    onChange={(e) => setFillBlankAnswer(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={t('teacher.topicDetail.saveModalFillBlankPlaceholder')}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">{t('teacher.topicDetail.saveModalFillBlankHint')}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-semibold text-indigo-900">{t('teacher.topicDetail.saveModalOptionsLabelMatching')}</label>
                    <button
                      type="button"
                      onClick={() => setNewMatchingPairs([...newMatchingPairs, { leftText: '', rightText: '' }])}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      {t('teacher.topicDetail.saveModalAddPairBtn')}
                    </button>
                  </div>
                  <div className="space-y-3">
                    {newMatchingPairs.map((pair, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <textarea
                          value={pair.leftText}
                          onChange={(e) => {
                            const newPairs = [...newMatchingPairs];
                            newPairs[i].leftText = e.target.value;
                            setNewMatchingPairs(newPairs);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                          placeholder={t('teacher.topicDetail.saveModalLeftSidePlaceholder', { index: i + 1 })}
                          rows={2}
                          required
                        />
                        <span className="text-gray-400 font-bold">-</span>
                        <textarea
                          value={pair.rightText}
                          onChange={(e) => {
                            const newPairs = [...newMatchingPairs];
                            newPairs[i].rightText = e.target.value;
                            setNewMatchingPairs(newPairs);
                          }}
                          className="flex-1 px-3 py-2 border border-gray-200 bg-white rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                          placeholder={t('teacher.topicDetail.saveModalRightSidePlaceholder', { index: i + 1 })}
                          rows={2}
                          required
                        />
                        {newMatchingPairs.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const newPairs = [...newMatchingPairs];
                              newPairs.splice(i, 1);
                              setNewMatchingPairs(newPairs);
                            }}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-md"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
            >
              {t('teacher.topicDetail.saveModalCancel')}
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center transition-colors text-sm shadow-sm"
            >
              {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              {editingQuestion ? t('teacher.topicDetail.saveModalSaveBtnEdit') : t('teacher.topicDetail.saveModalSaveBtnAdd')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
