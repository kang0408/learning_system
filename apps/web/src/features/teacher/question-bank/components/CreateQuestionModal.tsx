import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Save, Star, X, Plus } from 'lucide-react';
import { useCreateQuestion } from '../hooks/useTeacherQuestionBank';
import type { Topic } from '../types';
import { toast } from '@/utils/toast';
import { Select } from '@/components/ui/Select';
import { TreeSelect } from '@/components/ui/TreeSelect';
import type { TreeSelectOption } from '@/components/ui/TreeSelect';
import { Dialog } from '@/components/ui/Dialog';
import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Button } from '@/components/ui/Button';

interface CreateQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  topics: Topic[];
}

export const CreateQuestionModal: React.FC<CreateQuestionModalProps> = ({ isOpen, onClose, topics }) => {
  const { t } = useTranslation();
  const { mutateAsync: createQuestion, isPending } = useCreateQuestion();
  
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
    if (isOpen && topics.length > 0 && !selectedTopicId) {
      setSelectedTopicId(topics[0].id);
    }
  }, [isOpen, topics, selectedTopicId]);

  const handleOptionChange = (idx: number, val: string) => {
    const opts = [...newOptions];
    opts[idx] = val;
    setNewOptions(opts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;

    let answer_options: any[] = [];
    let metadata: any = undefined;

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
        { content: t('teacher.questionBank.createQuestion.trueOption'), is_correct: isTrueStatement, order_index: 0 },
        { content: t('teacher.questionBank.createQuestion.falseOption'), is_correct: !isTrueStatement, order_index: 1 }
      ];
    } else if (newType === 'fill_blank') {
      answer_options = [
        { content: fillBlankAnswer.trim(), is_correct: true, order_index: 0 }
      ];
    } else if (newType === 'matching') {
      metadata = {
        pairs: newMatchingPairs.filter(p => p.leftText.trim() && p.rightText.trim())
      };
    }

    try {
      await createQuestion({
        topic_id: selectedTopicId || undefined,
        question_type: newType,
        content: newContent,
        difficulty: newDifficulty,
        explanation: newExplanation,
        answer_options,
        metadata
      });
      
      toast.success(t('teacher.questionBank.createQuestion.success'));
      onClose();
      setNewContent('');
      setNewOptions(['', '', '', '']);
      setNewCorrectOption(0);
      setNewMultiCorrectOptions([false, false, false, false]);
      setIsTrueStatement(true);
      setNewDifficulty(3);
      setNewExplanation('');
      setFillBlankAnswer('');
      setNewMatchingPairs([
        { leftText: '', rightText: '' },
        { leftText: '', rightText: '' }
      ]);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.questionBank.createQuestion.errorCreate'));
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={t('teacher.questionBank.createQuestion.title')}
      description={t('teacher.questionBank.createQuestion.description')}
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label required>{t('teacher.questionBank.createQuestion.topicLabel')}</Label>
            <TreeSelect
              value={selectedTopicId}
              onChange={(val) => setSelectedTopicId(val)}
              options={
                topics.map(function mapTopic(t: Topic): TreeSelectOption {
                  return {
                    label: `${t.name} ${t.code ? `(${t.code})` : ''}`.trim(),
                    value: t.id,
                    children: t.children?.map(mapTopic)
                  };
                })
              }
              placeholder={t('teacher.questionBank.createQuestion.topicUncategorized')}
            />
          </div>

          <div>
            <Label>{t('teacher.questionBank.createQuestion.typeLabel')}</Label>
            <Select
              value={newType}
              onChange={(val) => setNewType(val)}
              options={[
                { label: t('teacher.questionBank.createQuestion.typeMultipleChoice'), value: 'multiple_choice' },
                { label: t('teacher.questionBank.createQuestion.typeMultiSelect'), value: 'multi_select' },
                { label: t('teacher.questionBank.createQuestion.typeTrueFalse'), value: 'true_false' },
                { label: t('teacher.questionBank.createQuestion.typeFillBlank'), value: 'fill_blank' },
                { label: t('teacher.questionBank.createQuestion.typeMatching'), value: 'matching' }
              ]}
            />
          </div>
        </div>

        <div>
          <Label required>{t('teacher.questionBank.createQuestion.contentLabel')}</Label>
          <Textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            rows={4}
            placeholder={t('teacher.questionBank.createQuestion.contentPlaceholder')}
            required
          />
        </div>

        <div>
          <Label>{t('teacher.questionBank.createQuestion.difficultyLabel')}</Label>
          <div className="flex items-center gap-1 bg-slate-50 w-fit px-4 py-2 rounded-xl border border-slate-200">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setNewDifficulty(star)}
                className={`p-1 transition-all duration-200 transform hover:scale-110 ${newDifficulty >= star ? 'text-amber-400' : 'text-gray-300 hover:text-amber-200'}`}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>{t('teacher.questionBank.createQuestion.detailExplanationLabel')}</Label>
          <Textarea
            value={newExplanation}
            onChange={(e) => setNewExplanation(e.target.value)}
            rows={2}
            placeholder={t('teacher.questionBank.createQuestion.detailExplanationPlaceholder')}
          />
        </div>

        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/80">
          {newType === 'multiple_choice' ? (
            <div>
              <Label className="text-indigo-900 mb-3 block">{t('teacher.questionBank.createQuestion.optionsLabel')}</Label>
              <div className="space-y-3">
                {newOptions.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${newCorrectOption === i ? 'border-indigo-300 bg-white shadow-sm' : 'border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200'}`}>
                    <input
                      type="radio"
                      name="correct_option"
                      checked={newCorrectOption === i}
                      onChange={() => setNewCorrectOption(i)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 focus:ring-indigo-500 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="border-0 bg-transparent shadow-none px-0 focus-visible:ring-0 focus-visible:border-transparent"
                      placeholder={t('teacher.questionBank.createQuestion.optionPlaceholder', { index: i + 1 })}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : newType === 'multi_select' ? (
            <div>
              <Label className="text-indigo-900 mb-3 block">{t('teacher.questionBank.createQuestion.multiSelectLabel')}</Label>
              <div className="space-y-3">
                {newOptions.map((opt, i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-colors ${newMultiCorrectOptions[i] ? 'border-indigo-300 bg-white shadow-sm' : 'border-gray-200 bg-white/50 hover:bg-white hover:border-indigo-200'}`}>
                    <Checkbox
                      checked={newMultiCorrectOptions[i]}
                      onChange={(e) => {
                        const newArr = [...newMultiCorrectOptions];
                        newArr[i] = e.target.checked;
                        setNewMultiCorrectOptions(newArr);
                      }}
                    />
                    <Input
                      type="text"
                      value={opt}
                      onChange={(e) => handleOptionChange(i, e.target.value)}
                      className="border-0 bg-transparent shadow-none px-0 focus-visible:ring-0 focus-visible:border-transparent"
                      placeholder={t('teacher.questionBank.createQuestion.optionPlaceholder', { index: i + 1 })}
                      required
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : newType === 'true_false' ? (
            <div>
              <Label className="text-indigo-900 mb-3 block">{t('teacher.questionBank.createQuestion.trueStatement')}</Label>
              <div className="flex gap-4">
                <Button
                  type="button"
                  variant={isTrueStatement ? 'success' : 'outline'}
                  onClick={() => setIsTrueStatement(true)}
                  className="flex-1 py-3"
                >
                  {t('teacher.questionBank.createQuestion.trueOption')}
                </Button>
                <Button
                  type="button"
                  variant={!isTrueStatement ? 'danger' : 'outline'}
                  onClick={() => setIsTrueStatement(false)}
                  className="flex-1 py-3"
                >
                  {t('teacher.questionBank.createQuestion.falseOption')}
                </Button>
              </div>
            </div>
          ) : newType === 'fill_blank' ? (
            <div>
              <Label className="text-indigo-900 mb-2 block">{t('teacher.questionBank.createQuestion.fillBlankLabel')}</Label>
              <Input
                type="text"
                value={fillBlankAnswer}
                onChange={(e) => setFillBlankAnswer(e.target.value)}
                className="bg-white"
                placeholder={t('teacher.questionBank.createQuestion.fillBlankPlaceholder')}
                required
              />
              <p className="text-xs text-indigo-700/80 font-medium mt-2">{t('teacher.questionBank.createQuestion.fillBlankHint')}</p>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-indigo-900">{t('teacher.questionBank.createQuestion.matchingLabel')}</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setNewMatchingPairs([...newMatchingPairs, { leftText: '', rightText: '' }])}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  {t('teacher.questionBank.createQuestion.addPairBtn')}
                </Button>
              </div>
              <div className="space-y-3">
                {newMatchingPairs.map((pair, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Textarea
                      value={pair.leftText}
                      onChange={(e) => {
                        const newPairs = [...newMatchingPairs];
                        newPairs[i].leftText = e.target.value;
                        setNewMatchingPairs(newPairs);
                      }}
                      className="flex-1 bg-white"
                      placeholder={t('teacher.questionBank.createQuestion.leftSidePlaceholder', { index: i + 1 })}
                      rows={2}
                      required
                    />
                    <span className="text-gray-400 font-bold">-</span>
                    <Textarea
                      value={pair.rightText}
                      onChange={(e) => {
                        const newPairs = [...newMatchingPairs];
                        newPairs[i].rightText = e.target.value;
                        setNewMatchingPairs(newPairs);
                      }}
                      className="flex-1 bg-white"
                      placeholder={t('teacher.questionBank.createQuestion.rightSidePlaceholder', { index: i + 1 })}
                      rows={2}
                      required
                    />
                    {newMatchingPairs.length > 2 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          const newPairs = [...newMatchingPairs];
                          newPairs.splice(i, 1);
                          setNewMatchingPairs(newPairs);
                        }}
                        className="text-red-500 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-5 mt-5 border-t border-gray-100">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
          >
            {t('teacher.questionBank.createQuestion.cancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {t('teacher.questionBank.createQuestion.save')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
