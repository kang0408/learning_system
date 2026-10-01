import { prisma } from '../lib/prisma';
import { emailQueue } from './emailQueue';

export async function remindDueQuestions() {
  console.log('[Job] Running daily reminder for due questions at 7:00 AM...');
  
  try {
    const today = new Date();
    today.setHours(0,0,0,0);

    const dueProgress = await prisma.sm2Progress.groupBy({
      by: ['student_id'],
      where: { next_review_date: { lte: today } },
      _count: { question_id: true }
    });

    const eligibleRecords = dueProgress.filter(r => r._count.question_id > 0);
    if (eligibleRecords.length > 0) {
      const studentIds = eligibleRecords.map(r => r.student_id);
      const students = await prisma.user.findMany({
        where: {
          id: { in: studentIds },
          is_active: true,
        },
        select: {
          id: true,
          email: true,
          full_name: true,
        },
      });

      const studentMap = new Map(students.map(s => [s.id, s]));

      for (const record of eligibleRecords) {
        const student = studentMap.get(record.student_id);
        const count = record._count.question_id;

        // Log notification
        console.log(`[Notification] To Student ${record.student_id}: Bạn có ${count} câu cần ôn hôm nay. Học ngay để duy trì streak!`);

        if (student && student.email) {
          emailQueue.add({
            type: 'SM2_DUE_REMINDER',
            email: student.email,
            studentName: student.full_name,
            dueCount: count,
          }).catch(err => console.error('[EmailQueue] Add failed:', err));
        }
      }
    }
    
    console.log('[Job] Daily reminder finished.');
  } catch (err) {
    console.error('[Job] Error in remindDueQuestions:', err);
  }
}
