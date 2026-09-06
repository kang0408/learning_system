import { useState } from 'react';
import { useTopics, useTeacherClasses } from './hooks/useTeacherQuestionBank';
import { useDebounce } from '../../../hooks/useDebounce';
import { QuestionBankHeader } from './components/QuestionBankHeader';
import { TopicList } from './components/TopicList';
import { CreateTopicModal } from './components/CreateTopicModal';
import { CreateQuestionModal } from './components/CreateQuestionModal';

export default function TeacherQuestionBankFeature() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: classes = [] } = useTeacherClasses();
  const { data: topics = [] } = useTopics(debouncedSearchTerm, selectedClassId);

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      <QuestionBankHeader
        totalTopics={topics.length}
        onOpenCreateTopic={() => setShowTopicModal(true)}
        onOpenCreateQuestion={() => setShowQuestionModal(true)}
      />

      <TopicList 
        topics={topics}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        classes={classes}
        selectedClassId={selectedClassId}
        onClassChange={setSelectedClassId}
      />

      <CreateTopicModal 
        isOpen={showTopicModal} 
        onClose={() => setShowTopicModal(false)} 
        topics={topics}
      />
      
      <CreateQuestionModal 
        isOpen={showQuestionModal} 
        onClose={() => setShowQuestionModal(false)} 
        topics={topics}
      />
    </div>
  );
}
