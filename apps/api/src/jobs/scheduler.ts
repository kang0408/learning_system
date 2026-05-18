import cron from 'node-cron';
import { sendWeeklyReport } from './sendWeeklyReport.job';

export function startCronJobs() {
  // Run at 08:00 AM every Sunday
  cron.schedule('0 8 * * 0', async () => {
    try {
      await sendWeeklyReport();
    } catch (err) {
      console.error('Error running weekly report job:', err);
    }
  });
  console.log('Cron jobs started.');
}
