import React, { useState } from 'react';
import { useTopics } from './hooks/useTeacherQuestionBank';
import { useDebounce } from '../../../hooks/useDebounce';
import { QuestionBankHeader } from './components/QuestionBankHeader';
import { TopicList } from './components/TopicList';
import { CreateTopicModal } from './components/CreateTopicModal';
import { CreateQuestionModal } from './components/CreateQuestionModal';
import { ImportCsvModal } from './components/ImportCsvModal';

export default function TeacherQuestionBankFeature() {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const { data: topics } = useTopics(debouncedSearchTerm);

  const [showTopicModal, setShowTopicModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6">
      <QuestionBankHeader
        totalTopics={topics.length}
        onOpenImport={() => setShowImportModal(true)}
        onOpenCreateTopic={() => setShowTopicModal(true)}
        onOpenCreateQuestion={() => setShowQuestionModal(true)}
      />

      <TopicList 
        topics={topics}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
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
      
      <ImportCsvModal 
        isOpen={showImportModal} 
        onClose={() => setShowImportModal(false)} 
      />
    </div>
  );
}
