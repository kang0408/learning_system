import React from 'react';
import { useParams } from 'react-router-dom';
import { useEditAssignmentData } from './hooks/useTeacherEditAssignment';
import { EditAssignmentHeader } from './components/EditAssignmentHeader';
import { EditAssignmentForm } from './components/EditAssignmentForm';

export const TeacherClassEditAssignmentFeature: React.FC = () => {
  const { id: classId, assignmentId } = useParams<{ id: string, assignmentId: string }>();
  const { data } = useEditAssignmentData(classId || '', assignmentId || '');

  // Prepare initial selection state based on the fetched assignment
  const topicCounts: Record<string, number> = {};
  const allQuestionIds: string[] = [];
  const questionIdToTopicId: Record<string, string> = {};

  const assignedQs = data.assignment.assignment_questions || [];

  assignedQs.forEach((aq) => {
    allQuestionIds.push(aq.question_id);
    if (aq.question && aq.question.topic_id) {
      const tId = aq.question.topic_id;
      topicCounts[tId] = (topicCounts[tId] || 0) + 1;
      questionIdToTopicId[aq.question_id] = tId;
    }
  });

  const initialTopicIds: string[] = [];
  const initialQuestionIds: string[] = [];

  data.topics.forEach((topic) => {
    const assignedCount = topicCounts[topic.id] || 0;
    const totalCount = topic._count?.questions || 0;

    if (totalCount > 0 && assignedCount === totalCount) {
      initialTopicIds.push(topic.id);
    }
  });

  allQuestionIds.forEach(qId => {
    const tId = questionIdToTopicId[qId];
    if (tId && initialTopicIds.includes(tId)) {
      // covered by topic, skip adding to individual list
    } else {
      initialQuestionIds.push(qId);
    }
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 pb-16">
      <EditAssignmentHeader classId={classId || ''} />

      <EditAssignmentForm 
        classId={classId || ''}
        assignmentId={assignmentId || ''}
        initialAssignment={data.assignment}
        topics={data.topics}
        members={data.members}
        initialTopicIds={initialTopicIds}
        initialQuestionIds={initialQuestionIds}
      />
    </div>
  );
};

export default TeacherClassEditAssignmentFeature;
