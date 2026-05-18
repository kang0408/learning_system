import { prisma } from '../lib/prisma';

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

    for (const record of dueProgress) {
      if (record._count.question_id > 0) {
        // Mock sending push notification
        console.log(`[Notification] To Student ${record.student_id}: Bạn có ${record._count.question_id} câu cần ôn hôm nay. Học ngay để duy trì streak!`);
      }
    }
    
    console.log('[Job] Daily reminder finished.');
  } catch (err) {
    console.error('[Job] Error in remindDueQuestions:', err);
  }
}
