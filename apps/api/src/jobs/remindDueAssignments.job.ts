import { prisma } from '../lib/prisma';
import { emailQueue } from './emailQueue';
import { AssignmentsRepository } from '../modules/assignments/assignments.repository';

const assignmentsRepository = new AssignmentsRepository(prisma);

export async function remindDueAssignments() {
  console.log('[Job] Running daily reminder for due assignments at 8:00 AM...');
  
  try {
    const assignments = await assignmentsRepository.findPendingAssignmentsDueIn24h();

    for (const assignment of assignments) {
      if (!assignment.deadline) continue;

      let studentsToRemind: any[] = [];
      const completedStudentIds = new Set(assignment.quiz_sessions.map(qs => qs.student_id));

      if (assignment.is_all_students) {
        studentsToRemind = assignment.class.members
          .filter(m => !completedStudentIds.has(m.student.id))
          .map(m => m.student);
      } else {
        studentsToRemind = assignment.assigned_students
          .filter(m => !completedStudentIds.has(m.student.id))
          .map(m => m.student);
      }

      for (const student of studentsToRemind) {
        if (student.email) {
          emailQueue.add({
            type: 'DEADLINE_REMINDER',
            email: student.email,
            studentName: student.full_name,
            assignmentTitle: assignment.title,
            deadline: assignment.deadline
          }).catch(err => console.error('[EmailQueue] Add failed:', err));
        }
      }
    }
    
    console.log('[Job] Daily reminder for due assignments finished.');
  } catch (err) {
    console.error('[Job] Error in remindDueAssignments:', err);
  }
}
