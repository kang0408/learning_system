# TeacherClassDetail Redesign Implementation Plan

> **For Antigravity:** REQUIRED SUB-SKILL: Load executing-plans to implement this plan task-by-task.

**Goal:** Redesign the TeacherClassDetail view into a tabbed interface (Analytics, Students, Assignments) with comprehensive metrics, topic analysis charts, and detailed leaderboards, supported by backend API updates.

**Architecture:** 
1. Update API controllers and services to aggregate metrics (active students, completion rate, average score, trends) and include `quiz_sessions` in assignments.
2. Add a new API endpoint to fetch students by specific topic performance.
3. Restructure `TeacherClassDetail.tsx` using a tabbed navigation system.
4. Implement `Chart.js` (via `react-chartjs-2`) for the horizontal topic accuracy bar chart.
5. Create modals for drill-down analysis (students weak in a topic) and individual student details.

**Tech Stack:** React, TailwindCSS, Chart.js, Prisma, Express.

---

### Task 1: Update Class Stats API to Calculate Trends

**Files:**
- Modify: `apps/api/src/modules/analytics/analytics.service.ts`

**Step 1: Write the minimal implementation**

Update `getTeacherClassStats` to calculate current and previous week metrics:

```typescript
  static async getTeacherClassStats(teacherId: string, classId: string) {
    const classData = await prisma.class.findFirst({ where: { id: classId, teacher_id: teacherId } });
    if (!classData) throw { status: 403, message: 'Forbidden' };

    const totalStudents = await prisma.classMember.count({ where: { class_id: classId, is_active: true } });

    // Current week active
    const activeStudentsResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = \${classId}::uuid AND qs.started_at >= NOW() - INTERVAL '7 days';
    `;
    const currentActive = activeStudentsResult[0]?.active_count || 0;

    // Previous week active
    const prevActiveStudentsResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = \${classId}::uuid 
        AND qs.started_at >= NOW() - INTERVAL '14 days'
        AND qs.started_at < NOW() - INTERVAL '7 days';
    `;
    const prevActive = prevActiveStudentsResult[0]?.active_count || 0;

    // Averages (current and previous)
    const currentAvg: any = await prisma.$queryRaw`
      SELECT COALESCE(AVG(score), 0)::float as avg_score
      FROM quiz_sessions qs
      JOIN assignments a ON a.id = qs.assignment_id
      WHERE a.class_id = \${classId}::uuid AND qs.status = 'completed' AND qs.started_at >= NOW() - INTERVAL '7 days';
    `;

    const prevAvg: any = await prisma.$queryRaw`
      SELECT COALESCE(AVG(score), 0)::float as avg_score
      FROM quiz_sessions qs
      JOIN assignments a ON a.id = qs.assignment_id
      WHERE a.class_id = \${classId}::uuid AND qs.status = 'completed' 
        AND qs.started_at >= NOW() - INTERVAL '14 days'
        AND qs.started_at < NOW() - INTERVAL '7 days';
    `;

    // Completion Rate (assignments with at least one completed session)
    const totalAssignments = await prisma.assignment.count({ where: { class_id: classId, deleted_at: null } });
    const completionRate = totalAssignments > 0 ? Math.round((currentActive / totalStudents) * 100) : 0; 
    const prevCompletionRate = totalAssignments > 0 ? Math.round((prevActive / totalStudents) * 100) : 0;

    return {
      class_name: classData.name,
      total_students: totalStudents,
      active_students: {
        current: currentActive,
        trend: currentActive >= prevActive ? 'up' : 'down'
      },
      completion_rate: {
        current: isNaN(completionRate) ? 0 : completionRate,
        trend: completionRate >= prevCompletionRate ? 'up' : 'down'
      },
      average_score: {
        current: Math.round(currentAvg[0]?.avg_score || 0),
        trend: (currentAvg[0]?.avg_score || 0) >= (prevAvg[0]?.avg_score || 0) ? 'up' : 'down'
      }
    };
  }
```

**Step 2: Commit**

```bash
git add apps/api/src/modules/analytics/analytics.service.ts
git commit -m "feat: enhance class stats with trends in analytics service"
```

---

### Task 2: Create API Endpoint for Students by Topic

**Files:**
- Modify: `apps/api/src/modules/analytics/analytics.routes.ts`
- Modify: `apps/api/src/modules/analytics/analytics.controller.ts`
- Modify: `apps/api/src/modules/analytics/analytics.service.ts`

**Step 1: Write the minimal implementation**

In `analytics.service.ts`, add:
```typescript
  static async getTeacherClassTopicStudents(teacherId: string, classId: string, topicName: string) {
    const topicFilter = topicName === 'General' ? null : topicName;
    const students = await prisma.$queryRaw`
      SELECT 
        u.id as student_id,
        u.full_name as name,
        COALESCE(SUM(qs.score), 0)::int as score,
        ROUND(SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(sa.id), 0), 2) as accuracy_pct
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      JOIN quiz_sessions qs ON qs.student_id = cm.student_id
      JOIN assignments a ON a.id = qs.assignment_id
      JOIN session_answers sa ON sa.session_id = qs.id
      JOIN questions q ON q.id = sa.question_id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE cm.class_id = \${classId}::uuid 
        AND a.class_id = \${classId}::uuid
        AND qs.status = 'completed'
        AND (t.name = \${topicFilter} OR (\${topicFilter} IS NULL AND t.id IS NULL))
      GROUP BY u.id, u.full_name
      ORDER BY accuracy_pct ASC, score DESC
    `;
    return students;
  }
```

In `analytics.controller.ts`, add:
```typescript
  static async getTeacherClassTopicStudents(req: any, res: Response) {
    const { classId, topicName } = req.params;
    const students = await AnalyticsService.getTeacherClassTopicStudents(req.user.userId, classId, decodeURIComponent(topicName));
    res.json({ success: true, data: students });
  }
```

In `analytics.routes.ts`, add:
```typescript
router.get('/class/:classId/topics/:topicName/students', requireAuth, requireRole(['teacher']), AnalyticsController.getTeacherClassTopicStudents);
```

**Step 2: Commit**

```bash
git add apps/api/src/modules/analytics
git commit -m "feat: add endpoint to fetch students by topic performance"
```

---

### Task 3: Enhance Leaderboard Query with Extra Fields

**Files:**
- Modify: `apps/api/src/modules/analytics/analytics.service.ts`

**Step 1: Write the minimal implementation**

Update `getTeacherClassStudents` to include `sessions_count`, `accuracy`, and `last_active_at`:

```typescript
  static async getTeacherClassStudents(teacherId: string, classId: string) {
    const students = await prisma.$queryRaw`
      WITH BestScores AS (
        SELECT 
          qs.student_id,
          qs.assignment_id,
          MAX(qs.score) as best_score,
          COUNT(qs.id) as attempts,
          MAX(qs.finished_at) as last_active,
          SUM(qs.correct_q) as total_correct,
          SUM(qs.total_q) as total_questions
        FROM quiz_sessions qs
        JOIN assignments a ON a.id = qs.assignment_id
        WHERE a.class_id = \${classId}::uuid AND qs.status = 'completed'
        GROUP BY qs.student_id, qs.assignment_id
      )
      SELECT 
        u.id as student_id,
        u.full_name as name,
        COALESCE(SUM(bs.best_score), 0)::int as score,
        COALESCE(SUM(bs.attempts), 0)::int as sessions_count,
        ROUND(COALESCE(SUM(bs.total_correct) * 100.0 / NULLIF(SUM(bs.total_questions), 0), 0), 2) as accuracy,
        MAX(bs.last_active) as last_active_at
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      LEFT JOIN BestScores bs ON bs.student_id = cm.student_id
      WHERE cm.class_id = \${classId}::uuid AND cm.is_active = true
      GROUP BY u.id, u.full_name
      ORDER BY score DESC
    `;
    return students;
  }
```

**Step 2: Commit**

```bash
git add apps/api/src/modules/analytics/analytics.service.ts
git commit -m "feat: enhance class students leaderboard with accuracy and sessions count"
```

---

### Task 4: Include Quiz Sessions in Assignments API

**Files:**
- Modify: `apps/api/src/modules/assignments/assignments.service.ts`

**Step 1: Write the minimal implementation**

In `getAssignments`, add `quiz_sessions` to the include block:
```typescript
    const assignments = await prisma.assignment.findMany({
      where,
      include: {
        assigned_students: {
          include: { student: { select: { id: true, full_name: true, email: true } } }
        },
        quiz_sessions: true
      },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: 'desc' }
    });
```

**Step 2: Commit**

```bash
git add apps/api/src/modules/assignments/assignments.service.ts
git commit -m "feat: include quiz sessions when fetching assignments for completion tracking"
```

---

### Task 5: Implement UI Tabs and Metric Cards in TeacherClassDetail

**Files:**
- Modify: `apps/web/src/pages/teacher/TeacherClassDetail.tsx`

**Step 1: Write the minimal implementation**

Restructure the file to use Tabs (`'analytics'`, `'students'`, `'assignments'`). 
Install dependencies if needed: `npm install chart.js react-chartjs-2` (Run in apps/web if not present, but assume we will just use basic UI for now if Chart.js is complex, or add standard Chart.js imports).

Add `activeTab` state.
Map `statsRes.data.data` properly into metric cards using `ArrowUpRight`, `ArrowDownRight`.

*(Since providing the full 400-line React file here is too large, the execution agent should focus on replacing the main render block with a Tab selector and conditional rendering of 3 sections: `<AnalyticsTab />`, `<StudentsTab />`, `<AssignmentsTab />`)*.

Example Tab Selector:
```tsx
<div className="flex space-x-4 border-b border-gray-200 mb-6">
  {['analytics', 'students', 'assignments'].map(tab => (
    <button
      key={tab}
      onClick={() => setActiveTab(tab as any)}
      className={\`pb-2 font-medium capitalize \${activeTab === tab ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500'}\`}
    >
      {tab === 'analytics' ? 'Phân tích' : tab === 'students' ? 'Học sinh' : 'Bài tập'}
    </button>
  ))}
</div>
```

**Step 2: Commit**

```bash
git add apps/web/src/pages/teacher/TeacherClassDetail.tsx
git commit -m "feat: add tabs structure to TeacherClassDetail"
```

---

### Task 6: Implement Analytics Tab with Chart.js and Modal

**Files:**
- Modify: `apps/web/src/pages/teacher/TeacherClassDetail.tsx`

**Step 1: Write the minimal implementation**

In `TeacherClassDetail.tsx`:
1. Import Chart.js components:
```tsx
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);
```

2. Render the Horizontal Bar Chart in the Analytics tab:
```tsx
const chartData = {
  labels: analytics?.topic_accuracy.map(t => t.topic),
  datasets: [{
    label: 'Độ chính xác (%)',
    data: analytics?.topic_accuracy.map(t => t.accuracy),
    backgroundColor: analytics?.topic_accuracy.map(t => t.accuracy < 60 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(16, 185, 129, 0.8)'),
  }]
};

const chartOptions = {
  indexAxis: 'y' as const,
  onClick: (event: any, elements: any[]) => {
    if (elements.length > 0) {
       const topic = analytics?.topic_accuracy[elements[0].index].topic;
       openTopicModal(topic);
    }
  }
};
```

3. Create the Topic Drill-down Modal that calls `/api/analytics/class/\${id}/topics/\${topic}/students`.

**Step 2: Commit**

```bash
git add apps/web/src/pages/teacher/TeacherClassDetail.tsx
git commit -m "feat: implement topic horizontal bar chart and drill-down modal"
```

---

### Task 7: Implement Students and Assignments Tabs

**Files:**
- Modify: `apps/web/src/pages/teacher/TeacherClassDetail.tsx`

**Step 1: Write the minimal implementation**

**Students Tab:**
Render a table using `analytics.leaderboard`:
- Column: Name (Avatar placeholder)
- Column: Avg Score
- Column: Sessions
- Column: Accuracy
- Column: Last Active

**Assignments Tab:**
Render a table using `assignments`:
- Calculate `submittedCount = assignment.quiz_sessions ? new Set(assignment.quiz_sessions.map(s => s.student_id)).size : 0`.
- Calculate `avgScore`.
- Highlight row if `new Date(assignment.deadline) < new Date()` and `submittedCount < totalStudents`.

**Step 2: Commit**

```bash
git add apps/web/src/pages/teacher/TeacherClassDetail.tsx
git commit -m "feat: implement students and assignments tabs with tables"
```
