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
import { ConfirmDialog } from '@/components/ui/Dialog';
import type { Question } from './types';

export default function TeacherTopicDetailFeature() {
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
      setDeleteQuestionId(null);
    } catch (e) {
      alert('Không thể xóa câu hỏi');
    }
  };

  const handleDeleteTopicConfirm = async () => {
    try {
      await deleteTopic(topicId);
      navigate('/teacher/questions');
    } catch (e) {
      alert('Không thể xóa chủ đề');
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      <TopicDetailHeader
        topic={topic}
        onOpenEditTopic={() => setShowEditTopicModal(true)}
        onOpenDeleteTopic={() => setShowDeleteTopicConfirm(true)}
        onOpenCreateQuestion={handleOpenCreateQuestion}
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

      <ConfirmDialog
        isOpen={!!deleteQuestionId}
        onClose={() => setDeleteQuestionId(null)}
        onConfirm={handleDeleteQuestionConfirm}
        title="Xóa câu hỏi"
        description="Bạn có chắc muốn xóa câu hỏi này? Dữ liệu không thể khôi phục."
        confirmText="Xóa câu hỏi"
        isDanger={true}
        isLoading={deletingQuestion}
      />

      <ConfirmDialog
        isOpen={showDeleteTopicConfirm}
        onClose={() => setShowDeleteTopicConfirm(false)}
        onConfirm={handleDeleteTopicConfirm}
        title="Xóa chủ đề"
        description="Bạn có chắc muốn xóa TOÀN BỘ chủ đề này không? Các bài tập liên kết sẽ bị ảnh hưởng."
        confirmText="Xóa chủ đề"
        isDanger={true}
        isLoading={deletingTopic}
      />
    </div>
  );
}
