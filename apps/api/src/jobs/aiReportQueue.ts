import { AiService } from '../modules/ai/ai.service';
import { AiRepository } from '../modules/ai/ai.repository';
import { AiCacheRepository } from '../modules/ai/ai-cache.repository';
import * as Sentry from '@sentry/node';

type AiReportJobData = 
  | { type: 'STUDENT_REPORT'; studentId: string; stats: any }
  | { type: 'CLASS_REPORT'; classId: string; stats: any };

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

    // In a real app we'd inject these, but for a global queue we instantiate them
    const aiCacheRepo = new AiCacheRepository();
    const aiRepo = new AiRepository();
    const aiService = new AiService(aiCacheRepo, aiRepo);

    while (this.queue.length > 0) {
      const job = this.queue.shift()!;
      try {
        await this.execute(job, aiService, aiRepo);
        // Delay to prevent hitting Gemini Rate Limits (429)
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: any) {
        console.error('[AiReportQueue] Job failed:', error);
        Sentry.captureException(error);
        
        // Simple Exponential Backoff / Re-queue logic could be added here
        if (error.status === 429) {
           console.warn('[AiReportQueue] Rate limited! Adding back to queue...');
           this.queue.unshift(job); // Put back at the front
           await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10s
        }
      }
    }

    this.processing = false;
  }

  private async execute(job: T, aiService: AiService, aiRepo: AiRepository): Promise<void> {
    const aiJob = job as unknown as AiReportJobData;
    
    if (aiJob.type === 'STUDENT_REPORT') {
      const report = await aiService.generateStudentReport(aiJob.stats);
      if (report) {
        await aiRepo.saveStudentReport(aiJob.studentId, report);
      }
    } else if (aiJob.type === 'CLASS_REPORT') {
      const report = await aiService.generateClassReport(aiJob.stats);
      if (report) {
        await aiRepo.saveClassReport(aiJob.classId, report);
      }
    }
  }
}

export const aiReportQueue = new JobQueue<AiReportJobData>();
