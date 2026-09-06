import { useParams } from 'react-router-dom';
import { useNewAssignmentData } from './hooks/useTeacherNewAssignment';
import { NewAssignmentHeader } from './components/NewAssignmentHeader';
import { NewAssignmentForm } from './components/NewAssignmentForm';

export default function TeacherClassNewAssignmentFeature() {
  const { id: classId } = useParams<{ id: string }>();
  if (!classId) return null;

  const { data } = useNewAssignmentData(classId);

  return (
    <div className="space-y-6 sm:space-y-8 w-full">
      <NewAssignmentHeader classId={classId} />
      <NewAssignmentForm classId={classId} topics={data.topics} members={data.members} />
    </div>
  );
}
