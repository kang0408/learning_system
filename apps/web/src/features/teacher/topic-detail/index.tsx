import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { 
  useTopicDetail, 
  useTopicQuestions, 
  useAllTopics,
  useDeleteTopic,
  useDeleteQuestion 
} from './hooks/useTeacherTopicDetail';
import { TopicDetailHeader } from './components/TopicDetailHeader';
import { QuestionList } from './components/QuestionList';
import { EditTopicModal } from './components/EditTopicModal';
import { SaveQuestionModal } from './components/SaveQuestionModal';
import { GenerateAiQuestionsModal } from './components/GenerateAiQuestionsModal';
import { ConfirmDialog } from '@/components/ui/Dialog';
import type { Question } from './types';
import { toast } from '@/utils/toast';
import { useTranslation } from 'react-i18next';

export default function TeacherTopicDetailFeature() {
  const { t } = useTranslation();
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  
  if (!topicId) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: topic } = useTopicDetail(topicId);
  const { data: questions } = useTopicQuestions(topicId, debouncedSearchTerm);
  const { data: allTopics } = useAllTopics();
  
  const { mutateAsync: deleteTopic, isPending: deletingTopic } = useDeleteTopic();
  const { mutateAsync: deleteQuestion, isPending: deletingQuestion } = useDeleteQuestion();

  const [showEditTopicModal, setShowEditTopicModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showGenerateAiModal, setShowGenerateAiModal] = useState(false);
  
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [showDeleteTopicConfirm, setShowDeleteTopicConfirm] = useState(false);

  const handleOpenCreateQuestion = () => {
    setEditingQuestion(null);
    setShowQuestionModal(true);
  };

  const handleEditQuestion = (q: Question) => {
    setEditingQuestion(q);
    setShowQuestionModal(true);
  };

  const handleDeleteQuestionConfirm = async () => {
    if (!deleteQuestionId) return;
    try {
      await deleteQuestion(deleteQuestionId);
      toast.success(t('teacher.topicDetail.deleteQuestionSuccess'));
      setDeleteQuestionId(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('teacher.topicDetail.deleteQuestionError'));
    }
  };

  const handleDeleteTopicConfirm = async () => {
    try {
      await deleteTopic(topicId);
      toast.success(t('teacher.topicDetail.deleteTopicSuccess'));
      navigate('/teacher/questions');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || t('teacher.topicDetail.deleteTopicError'));
    }
  };

  return (
    <div className="space-y-8 max-w-8xl mx-auto px-4 sm:px-6">
      <TopicDetailHeader
        topic={topic}
        onOpenEditTopic={() => setShowEditTopicModal(true)}
        onOpenDeleteTopic={() => setShowDeleteTopicConfirm(true)}
        onOpenCreateQuestion={handleOpenCreateQuestion}
        onOpenGenerateAi={() => setShowGenerateAiModal(true)}
      />

      <QuestionList
        questions={questions}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onEditQuestion={handleEditQuestion}
        onDeleteQuestion={(id) => setDeleteQuestionId(id)}
        onOpenCreateQuestion={handleOpenCreateQuestion}
      />

      <EditTopicModal 
        isOpen={showEditTopicModal} 
        onClose={() => setShowEditTopicModal(false)} 
        topic={topic} 
      />

      <SaveQuestionModal 
        isOpen={showQuestionModal} 
        onClose={() => setShowQuestionModal(false)} 
        topics={allTopics}
        initialTopicId={topicId}
        editingQuestion={editingQuestion}
      />

      {topic && (
        <GenerateAiQuestionsModal
          isOpen={showGenerateAiModal}
          onClose={() => setShowGenerateAiModal(false)}
          topicId={topicId}
          topicName={topic.name}
        />
      )}

      <ConfirmDialog
        isOpen={!!deleteQuestionId}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={handleDeleteQuestionConfirm}
        title={t('teacher.topicDetail.deleteQuestionTitle')}
        description={t('teacher.topicDetail.deleteQuestionDesc')}
        confirmText={t('teacher.topicDetail.deleteQuestionConfirm')}
        isDanger={true}
        isLoading={deletingQuestion}
      />

      <ConfirmDialog
        isOpen={showDeleteTopicConfirm}
        onClose={() => setShowDeleteTopicConfirm(false)}
        onConfirm={handleDeleteTopicConfirm}
        title={t('teacher.topicDetail.deleteTopicTitle')}
        description={t('teacher.topicDetail.deleteTopicDesc')}
        confirmText={t('teacher.topicDetail.deleteTopicConfirm')}
        isDanger={true}
        isLoading={deletingTopic}
      />
    </div>
  );
}
