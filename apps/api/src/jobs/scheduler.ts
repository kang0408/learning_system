import cron from 'node-cron';
import { sendWeeklyReport } from './sendWeeklyReport.job';
import { remindDueQuestions } from './remindDueQuestions.job';
import { remindDueAssignments } from './remindDueAssignments.job';

export function startCronJobs() {
  // Run at 07:00 AM every day
  cron.schedule('0 7 * * *', async () => {
    await remindDueQuestions();
  });

  // Run at 08:00 AM every Sunday
  cron.schedule('0 8 * * 0', async () => {
    await sendWeeklyReport();
  });

  // Run at 08:00 AM every day
  cron.schedule('0 8 * * *', async () => {
    await remindDueAssignments();
  });

  console.log('Cron jobs started: Daily Reminder (7:00 AM), Assignments Reminder (8:00 AM), Weekly Report (8:00 AM Sun)');
}
