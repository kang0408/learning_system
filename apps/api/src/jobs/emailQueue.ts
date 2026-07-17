import { sendNewAssignmentEmail, sendDeadlineReminderEmail } from '../lib/mailer';

type EmailJobData = 
  | { type: 'NEW_ASSIGNMENT'; email: string; studentName: string; assignmentTitle: string; deadline: Date | null }
  | { type: 'DEADLINE_REMINDER'; email: string; studentName: string; assignmentTitle: string; deadline: Date };

class JobQueue<T> {
  private queue: T[] = [];
  private processing = false;

  async add(job: T): Promise<void> {
    this.queue.push(job);
    if (!this.processing) {
      this.process();
    }
  }

  private async process(): Promise<void> {
    this.processing = true;

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      try {
        await this.execute(job);
        // Small delay to prevent hitting SMTP limits
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error('[JobQueue] Job failed:', error);
      }
    }

    this.processing = false;
  }

  private async execute(job: T): Promise<void> {
    const emailJob = job as unknown as EmailJobData;
    if (emailJob.type === 'NEW_ASSIGNMENT') {
      await sendNewAssignmentEmail(
        emailJob.email, 
        emailJob.studentName, 
        emailJob.assignmentTitle, 
        emailJob.deadline
      );
    } else if (emailJob.type === 'DEADLINE_REMINDER') {
      await sendDeadlineReminderEmail(
        emailJob.email, 
        emailJob.studentName, 
        emailJob.assignmentTitle, 
        emailJob.deadline
      );
    }
  }
}

export const emailQueue = new JobQueue<EmailJobData>();
