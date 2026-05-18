import cron from 'node-cron';
import { sendWeeklyReport } from './sendWeeklyReport.job';
import { remindDueQuestions } from './remindDueQuestions.job';

export function startCronJobs() {
  // Run at 07:00 AM every day
  cron.schedule('0 7 * * *', async () => {
    await remindDueQuestions();
  });

  // Run at 08:00 AM every Sunday
  cron.schedule('0 8 * * 0', async () => {
    await sendWeeklyReport();
  });

  console.log('Cron jobs started: Daily Reminder (7:00 AM), Weekly Report (8:00 AM Sun)');
}
