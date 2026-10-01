import './instrument'; // Must be the first import
import app from './app';
import dotenv from 'dotenv';
import { startCronJobs } from './jobs/scheduler';
import { prisma } from './lib/prisma';

dotenv.config();

const PORT = process.env.PORT || 4000;

async function ensureDbColumns() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE class_members ADD COLUMN IF NOT EXISTS teacher_feedback TEXT;`);
    await prisma.$executeRawUnsafe(`ALTER TABLE class_members ADD COLUMN IF NOT EXISTS feedback_updated_at TIMESTAMPTZ;`);
    console.log('[Database] class_members feedback columns verified and ready.');
  } catch (err: any) {
    console.warn('[Database] Schema auto-verify notice:', err.message);
  }
}

// Ensure database schema integrity on start/reload
ensureDbColumns();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
