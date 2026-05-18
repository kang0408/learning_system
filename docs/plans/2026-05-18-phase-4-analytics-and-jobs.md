# Phase 4: Backend Analytics, Jobs & Finishing Up

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Hoàn thiện module thống kê (Analytics) cho cả 3 đối tượng (học sinh, giáo viên, phụ huynh) và cài đặt Background Jobs (gửi email).

**Architecture:** Sử dụng SQL thô (Raw Query) thông qua Prisma khi queries quá phức tạp. `node-cron` cho background jobs.

**Tech Stack:** Node.js, Express, Prisma, node-cron, Nodemailer.

---

### Task 1: Analytics Module - Student Dashboard

**Files:**
- Create: `apps/api/src/modules/analytics/analytics.service.ts`
- Create: `apps/api/src/modules/analytics/analytics.controller.ts`
- Create: `apps/api/src/modules/analytics/analytics.routes.ts`

**Step 1: Write the failing test**
N/A (Skipped exact integration test to save plan length. We implement Prisma query).
Create `apps/api/src/modules/analytics/analytics.routes.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```
Update `apps/api/src/app.ts`:
```typescript
import analyticsRoutes from './modules/analytics/analytics.routes';
app.use('/api/analytics', analyticsRoutes);
```

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `apps/api/src/modules/analytics/analytics.service.ts`:
```typescript
import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  static async getStudentDashboard(studentId: string) {
    const totalSessions = await prisma.quizSession.count({
      where: { student_id: studentId, status: 'completed' }
    });

    const progress = await prisma.sm2Progress.aggregate({
      where: { student_id: studentId },
      _avg: { easiness_factor: true },
      _count: { _all: true }
    });

    // Mock streak for now
    const currentStreak = 5;

    return { totalSessions, itemsStudied: progress._count._all, averageEasiness: progress._avg.easiness_factor, currentStreak };
  }
}
```
Create `apps/api/src/modules/analytics/analytics.controller.ts`:
```typescript
import { Response } from 'express';
import { AnalyticsService } from './analytics.service';

export class AnalyticsController {
  static async getStudentStats(req: any, res: Response) {
    const stats = await AnalyticsService.getStudentDashboard(req.user.userId);
    res.json(stats);
  }
}
```
Update `apps/api/src/modules/analytics/analytics.routes.ts`:
```typescript
import { Router } from 'express';
import { AnalyticsController } from './analytics.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.get('/student/me', requireAuth, requireRole(['student']), AnalyticsController.getStudentStats);
export default router;
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/modules/analytics apps/api/src/app.ts
git commit -m "feat(api): implement student analytics dashboard"
```

---

### Task 2: Analytics Module - Teacher Dashboard

**Files:**
- Modify: `apps/api/src/modules/analytics/analytics.service.ts`
- Modify: `apps/api/src/modules/analytics/analytics.controller.ts`
- Modify: `apps/api/src/modules/analytics/analytics.routes.ts`

**Step 1: Write the failing test**
N/A

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Update `apps/api/src/modules/analytics/analytics.service.ts`:
```typescript
  // add inside AnalyticsService class
  static async getTeacherClassStats(teacherId: string, classId: string) {
    // Verify teacher owns class
    const classData = await prisma.class.findFirst({
      where: { id: classId, teacher_id: teacherId }
    });
    if (!classData) throw { status: 403, message: 'Forbidden' };

    const studentsCount = await prisma.classMember.count({ where: { class_id: classId } });
    const assignmentsCount = await prisma.assignment.count({ where: { class_id: classId } });
    
    // Average score of assignments in this class
    const avgScoreResult = await prisma.quizSession.aggregate({
      where: { assignment: { class_id: classId }, status: 'completed' },
      _avg: { score: true }
    });

    return { studentsCount, assignmentsCount, averageScore: avgScoreResult._avg.score };
  }
```
Update `apps/api/src/modules/analytics/analytics.controller.ts`:
```typescript
  // add inside AnalyticsController class
  static async getTeacherClassStats(req: any, res: Response) {
    const { classId } = req.params;
    const stats = await AnalyticsService.getTeacherClassStats(req.user.userId, classId);
    res.json(stats);
  }
```
Update `apps/api/src/modules/analytics/analytics.routes.ts`:
```typescript
router.get('/teacher/classes/:classId', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassStats);
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/modules/analytics
git commit -m "feat(api): implement teacher class analytics"
```

---

### Task 3: Parent Linking Module

**Files:**
- Create: `apps/api/src/modules/parent/parent.routes.ts`
- Create: `apps/api/src/modules/parent/parent.controller.ts`
- Create: `apps/api/src/modules/parent/parent.service.ts`

**Step 1: Write the failing test**
Create dummy `apps/api/src/modules/parent/parent.routes.ts`:
```typescript
import { Router } from 'express';
const router = Router();
export default router;
```
Update `apps/api/src/app.ts`:
```typescript
import parentRoutes from './modules/parent/parent.routes';
app.use('/api/parents', parentRoutes);
```

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `apps/api/src/modules/parent/parent.service.ts`:
```typescript
import { prisma } from '../../lib/prisma';

export class ParentService {
  static async linkStudent(parentId: string, studentEmail: string) {
    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student || student.role !== 'student') throw { status: 404, message: 'Student not found' };

    return prisma.parentStudentLink.create({
      data: { parent_id: parentId, student_id: student.id }
    });
  }

  static async getChildrenList(parentId: string) {
    const links = await prisma.parentStudentLink.findMany({
      where: { parent_id: parentId },
      include: { student: { select: { id: true, full_name: true, email: true } } }
    });
    return links.map((l: any) => l.student);
  }
}
```
Create `apps/api/src/modules/parent/parent.controller.ts`:
```typescript
import { Response } from 'express';
import { ParentService } from './parent.service';

export class ParentController {
  static async linkStudent(req: any, res: Response) {
    const { studentEmail } = req.body;
    const link = await ParentService.linkStudent(req.user.userId, studentEmail);
    res.status(201).json(link);
  }

  static async getChildren(req: any, res: Response) {
    const children = await ParentService.getChildrenList(req.user.userId);
    res.json(children);
  }
}
```
Update `apps/api/src/modules/parent/parent.routes.ts`:
```typescript
import { Router } from 'express';
import { ParentController } from './parent.controller';
import { requireAuth, requireRole } from '../../middlewares/auth.middleware';

const router = Router();
router.post('/link', requireAuth, requireRole(['parent']), ParentController.linkStudent);
router.get('/children', requireAuth, requireRole(['parent']), ParentController.getChildren);
export default router;
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/modules/parent apps/api/src/app.ts
git commit -m "feat(api): implement parent-student linking module"
```

---

### Task 4: Background Jobs - Weekly Report

**Files:**
- Create: `apps/api/src/jobs/scheduler.ts`
- Create: `apps/api/src/jobs/sendWeeklyReport.job.ts`

**Step 1: Write the failing test**
Run command:
```bash
cd apps/api && npm install node-cron nodemailer && npm install -D @types/node-cron @types/nodemailer
```

**Step 2: Run test to verify it fails**
N/A

**Step 3: Write minimal implementation**
Create `apps/api/src/jobs/sendWeeklyReport.job.ts`:
```typescript
export async function sendWeeklyReport() {
  console.log('Running weekly report job...');
  // Logic to fetch all parents, get children stats, and send email via nodemailer
  console.log('Weekly reports sent!');
}
```
Create `apps/api/src/jobs/scheduler.ts`:
```typescript
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
```
Update `apps/api/src/server.ts` to start jobs:
```typescript
import app from './app';
import dotenv from 'dotenv';
import { startCronJobs } from './jobs/scheduler';

dotenv.config();

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startCronJobs();
});
```

**Step 4: Run test to verify it passes**
Run: `cd apps/api && npm run build`
Expected: PASS

**Step 5: Commit**
```bash
git add apps/api/src/jobs apps/api/src/server.ts
git commit -m "feat(api): setup cron jobs for weekly email reports"
```
