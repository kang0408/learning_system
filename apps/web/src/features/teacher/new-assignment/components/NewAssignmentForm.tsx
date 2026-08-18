import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save } from 'lucide-react';
import { TopicQuestionsList } from './TopicQuestionsList';
import { useCreateAssignment } from '../hooks/useTeacherNewAssignment';
import type { Topic, ClassMember } from '../types';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';

interface NewAssignmentFormProps {
  classId: string;
  topics: Topic[];
  members: ClassMember[];
}

export const NewAssignmentForm: React.FC<NewAssignmentFormProps> = ({ classId, topics, members }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mutateAsync: createAssignment, isPending } = useCreateAssignment();

  const [form, setForm] = useState({
    title: '',
    description: '',
    topic_ids: [] as string[],
    question_ids: [] as string[],
    deadline: '',
    mode: 'adaptive',
    max_attempts: 0,
    time_limit: 0,
    assignToAll: true,
    student_ids: [] as string[],
  });

  const handleTopicCheckChange = (topicId: string, checked: boolean, allTopicQIds: string[]) => {
    setForm(prev => {
      if (checked) {
        const newTopicIds = [...prev.topic_ids, topicId];
        const newQIds = prev.question_ids.filter(qid => !allTopicQIds.includes(qid));
        return { ...prev, topic_ids: newTopicIds, question_ids: newQIds };
      } else {
        return {
          ...prev,
          topic_ids: prev.topic_ids.filter(tid => tid !== topicId)
        };
      }
    });
  };

  const handleQuestionCheckChange = (questionId: string, checked: boolean, allTopicQIds: string[]) => {
    setForm(prev => {
      let newTopicIds = [...prev.topic_ids];
      let newQIds = [...prev.question_ids];

      const topic = topics.find(t => t._count?.questions === allTopicQIds.length && allTopicQIds.length > 0);
      const topicId = topic?.id;

      if (topicId && prev.topic_ids.includes(topicId)) {
        if (!checked) {
          newTopicIds = newTopicIds.filter(id => id !== topicId);
          const otherQIds = allTopicQIds.filter(id => id !== questionId);
          newQIds = [...newQIds, ...otherQIds];
        }
      } else {
        if (checked) {
          newQIds.push(questionId);
          const allChecked = allTopicQIds.length > 0 && allTopicQIds.every(id => newQIds.includes(id));
          if (allChecked && topicId) {
            newTopicIds.push(topicId);
            newQIds = newQIds.filter(id => !allTopicQIds.includes(id));
          }
        } else {
          newQIds = newQIds.filter(id => id !== questionId);
        }
      }

      return {
        ...prev,
        topic_ids: newTopicIds,
        question_ids: newQIds
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.topic_ids.length === 0 && form.question_ids.length === 0) {
      toast.warning(t('teacher.newAssignment.validationNoQuestions'));
      return;
    }

    try {
      await createAssignment({
        class_id: classId,
        title: form.title,
        description: form.description,
        mode: form.mode,
        max_attempts: Number(form.max_attempts),
        time_limit: form.time_limit ? Number(form.time_limit) : null,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
        topic_ids: form.topic_ids,
        question_ids: form.question_ids,
        student_ids: form.assignToAll ? [] : form.student_ids
      });
      toast.success(t('teacher.newAssignment.createSuccess'));
      navigate(`/teacher/classes/${classId}?tab=assignments`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || t('teacher.newAssignment.createError'));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 md:p-8 rounded-2xl border border-gray-100 shadow-sm">
      <div>
        <Label required>{t('teacher.newAssignment.titleLabel')}</Label>
        <Input
          required
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          placeholder={t('teacher.newAssignment.titlePlaceholder')}
        />
      </div>

      <div>
        <Label>{t('teacher.newAssignment.descLabel')}</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          placeholder={t('teacher.newAssignment.descPlaceholder')}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <Label>{t('teacher.newAssignment.modeLabel')}</Label>
          <Select
            value={form.mode}
            onChange={(value) => setForm({ ...form, mode: value })}
            options={[
              { value: 'adaptive', label: t('teacher.newAssignment.modeAdaptive') },
              { value: 'standard', label: t('teacher.newAssignment.modeStandard') },
              { value: 'exam', label: t('teacher.newAssignment.modeExam') }
            ]}
          />
        </div>

        <div>
          <Label>{t('teacher.newAssignment.maxAttemptsLabel')}</Label>
          <Input
            type="number"
            min="0"
            value={form.max_attempts}
            onChange={e => setForm({ ...form, max_attempts: parseInt(e.target.value) || 0 })}
            placeholder={t('teacher.newAssignment.noLimitPlaceholder')}
          />
          <p className="text-xs text-slate-500 font-medium mt-1">{t('teacher.newAssignment.noLimitHint')}</p>
        </div>

        <div>
          <Label>{t('teacher.newAssignment.timeLimitLabel')}</Label>
          <Input
            type="number"
            min="0"
            value={form.time_limit}
            onChange={e => setForm({ ...form, time_limit: parseInt(e.target.value) || 0 })}
            placeholder={t('teacher.newAssignment.noLimitPlaceholder')}
          />
          <p className="text-xs text-slate-500 font-medium mt-1">{t('teacher.newAssignment.noLimitHint')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label>{t('teacher.newAssignment.deadlineLabel')}</Label>
          <Input
            type="datetime-local"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
          />
        </div>

        <div>
          <Label>{t('teacher.newAssignment.assignToLabel')}</Label>
          <Select
            value={form.assignToAll ? 'all' : 'specific'}
            onChange={(value) => {
              const isAll = value === 'all';
              setForm({ ...form, assignToAll: isAll, student_ids: isAll ? [] : form.student_ids });
            }}
            options={[
              { value: 'all', label: t('teacher.newAssignment.assignAll') },
              { value: 'specific', label: t('teacher.newAssignment.assignSpecific') }
            ]}
          />
        </div>
      </div>

      {!form.assignToAll && (
        <div className="bg-indigo-50/50 p-5 rounded-2xl border border-indigo-100">
          <Label className="text-indigo-900 mb-3">
            {t('teacher.newAssignment.selectStudents', { selected: form.student_ids.length, total: members.length })}
          </Label>
          <div className="bg-white rounded-xl border border-slate-200 max-h-[300px] overflow-y-auto space-y-1 p-2">
            {members.length === 0 ? (
              <p className="text-sm text-slate-500 text-center p-4 font-medium">{t('teacher.newAssignment.noStudents')}</p>
            ) : (
              members.map((member) => (
                <div key={member.student.id} className="flex items-center p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={form.student_ids.includes(member.student.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setForm(prev => ({
                          ...prev,
                          student_ids: [...prev.student_ids, member.student.id]
                        }));
                      } else {
                        setForm(prev => ({
                          ...prev,
                          student_ids: prev.student_ids.filter(id => id !== member.student.id)
                        }));
                      }
                    }}
                  />
                  <div className="flex items-center ml-3">
                    <Avatar size="sm" className="mr-3">
                      <AvatarFallback name={member.student.full_name} />
                    </Avatar>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">{member.student.full_name}</span>
                      <span className="text-slate-500 text-xs font-medium">{member.student.email}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div>
        <Label className="mb-3">{t('teacher.newAssignment.selectTopicsLabel')}</Label>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {(() => {
            const renderTopicNode = (topic: Topic, depth: number, isParentChecked = false) => {
              const isChecked = form.topic_ids.includes(topic.id);
              const isImplicitlyChecked = isParentChecked || isChecked;
              return (
              <React.Fragment key={topic.id}>
                <div style={{ paddingLeft: `${depth * 24}px` }}>
                  <TopicQuestionsList
                    topic={topic}
                    isTopicChecked={isChecked}
                    isImplicitlyChecked={isParentChecked}
                    selectedQuestionIds={form.question_ids}
                    onTopicCheckChange={handleTopicCheckChange}
                    onQuestionCheckChange={handleQuestionCheckChange}
                  />
                </div>
                {topic.children?.map(child => renderTopicNode(child, depth + 1, isImplicitlyChecked))}
              </React.Fragment>
            )};
            return topics.map(t => renderTopicNode(t, 0, false));
          })()}
          {topics.length === 0 && (
            <p className="text-sm text-slate-500 p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 font-medium">
              {t('teacher.newAssignment.noTopics')}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 mt-6 border-t border-slate-100 gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate(-1)}
        >
          {t('teacher.newAssignment.cancelBtn')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isPending}
        >
          <Save className="w-4 h-4 mr-2" />
          {t('teacher.newAssignment.createBtn')}
        </Button>
      </div>
    </form>
  );
};

