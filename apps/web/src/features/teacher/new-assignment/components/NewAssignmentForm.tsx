import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, Save } from 'lucide-react';
import { TopicQuestionsList } from './TopicQuestionsList';
import { useCreateAssignment } from '../hooks/useTeacherNewAssignment';
import type { Topic, ClassMember } from '../types';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

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
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.titleLabel')} <span className="text-red-500">*</span></label>
        <input
          required
          type="text"
          value={form.title}
          onChange={e => setForm({ ...form, title: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
          placeholder={t('teacher.newAssignment.titlePlaceholder')}
        />
      </div>

      <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.descLabel')}</label>
        <textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm resize-none"
          placeholder={t('teacher.newAssignment.descPlaceholder')}
          rows={4}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.modeLabel')}</label>
          <select
            value={form.mode}
            onChange={e => setForm({ ...form, mode: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
          >
            <option value="adaptive">{t('teacher.newAssignment.modeAdaptive')}</option>
            <option value="standard">{t('teacher.newAssignment.modeStandard')}</option>
            <option value="exam">{t('teacher.newAssignment.modeExam')}</option>
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.maxAttemptsLabel')}</label>
          <input
            type="number"
            min="0"
            value={form.max_attempts}
            onChange={e => setForm({ ...form, max_attempts: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
            placeholder={t('teacher.newAssignment.noLimitPlaceholder')}
          />
          <p className="text-xs text-gray-500">{t('teacher.newAssignment.noLimitHint')}</p>
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.timeLimitLabel')}</label>
          <input
            type="number"
            min="0"
            value={form.time_limit}
            onChange={e => setForm({ ...form, time_limit: parseInt(e.target.value) || 0 })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
            placeholder={t('teacher.newAssignment.noLimitPlaceholder')}
          />
          <p className="text-xs text-gray-500">{t('teacher.newAssignment.noLimitHint')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.deadlineLabel')}</label>
          <input
            type="datetime-local"
            value={form.deadline}
            onChange={e => setForm({ ...form, deadline: e.target.value })}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-gray-700">{t('teacher.newAssignment.assignToLabel')}</label>
          <select
            value={form.assignToAll ? 'all' : 'specific'}
            onChange={e => {
              const isAll = e.target.value === 'all';
              setForm({ ...form, assignToAll: isAll, student_ids: isAll ? [] : form.student_ids });
            }}
            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-sm"
          >
            <option value="all">{t('teacher.newAssignment.assignAll')}</option>
            <option value="specific">{t('teacher.newAssignment.assignSpecific')}</option>
          </select>
        </div>
      </div>

      {!form.assignToAll && (
        <div className="bg-indigo-50/50 p-5 rounded-xl border border-indigo-100">
          <label className="block text-sm font-semibold text-indigo-900 mb-3">
            {t('teacher.newAssignment.selectStudents', { selected: form.student_ids.length, total: members.length })}
          </label>
          <div className="bg-white rounded-xl border border-gray-200 max-h-[300px] overflow-y-auto space-y-1 p-2">
            {members.length === 0 ? (
              <p className="text-sm text-gray-500 text-center p-4">{t('teacher.newAssignment.noStudents')}</p>
            ) : (
              members.map((member) => (
                <label key={member.student.id} className="flex items-center p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors group">
                  <input
                    type="checkbox"
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
                    className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 mr-4"
                  />
                  <div className="flex items-center">
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold mr-3 text-sm border border-slate-200">
                      {member.student.full_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900 text-sm block">{member.student.full_name}</span>
                      <span className="text-gray-500 text-xs">{member.student.email}</span>
                    </div>
                  </div>
                </label>
              ))
            )}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-3">{t('teacher.newAssignment.selectTopicsLabel')}</label>
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
          {topics.map(topic => (
            <TopicQuestionsList
              key={topic.id}
              topic={topic}
              isTopicChecked={form.topic_ids.includes(topic.id)}
              selectedQuestionIds={form.question_ids}
              onTopicCheckChange={handleTopicCheckChange}
              onQuestionCheckChange={handleQuestionCheckChange}
            />
          ))}
          {topics.length === 0 && (
            <p className="text-sm text-gray-500 p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
              {t('teacher.newAssignment.noTopics')}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end pt-6 mt-6 border-t border-gray-100 gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors text-sm"
        >
          {t('teacher.newAssignment.cancelBtn')}
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-50 flex items-center transition-colors text-sm shadow-sm"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {t('teacher.newAssignment.createBtn')}
        </button>
      </div>
    </form>
  );
};
