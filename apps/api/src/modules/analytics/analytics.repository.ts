import { PrismaClient } from '@prisma/client';

export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaClient) {}
  // --- STUDENT ---

  async findAllTopics() {
    return this.prisma.topic.findMany({
      where: { deleted_at: null },
      select: { id: true, name: true, parent_id: true }
    });
  }
  async getActiveDates(studentId: string): Promise<{date: string}[]> {
    return this.prisma.$queryRaw<{date: string}[]>`
      SELECT DISTINCT DATE(started_at)::text as date
      FROM quiz_sessions
      WHERE student_id = ${studentId}::uuid AND status = 'completed'
      ORDER BY date DESC;
    `;
  }

  async getWeeklyActivity(studentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT DATE(started_at)::text as date, COUNT(id)::int as sessions, SUM(total_q)::int as questions, 
      (SUM(correct_q)::float / NULLIF(SUM(total_q), 0) * 100) as accuracy
      FROM quiz_sessions
      WHERE student_id = ${studentId}::uuid AND status = 'completed' AND started_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY DATE(started_at) ASC;
    `;
  }

  async getStudentCalendar(studentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        DATE(qs.started_at)::text as date,
        EXTRACT(DAY FROM qs.started_at)::int as day,
        COUNT(qs.id)::int as sessions_count,
        COALESCE(SUM(qs.total_q), 0)::int as questions_count,
        COALESCE((SUM(qs.correct_q)::float / NULLIF(SUM(qs.total_q), 0) * 100), 0) as accuracy
      FROM quiz_sessions qs
      WHERE qs.student_id = ${studentId}::uuid
        AND qs.status = 'completed'
        AND qs.started_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(qs.started_at), EXTRACT(DAY FROM qs.started_at)
      ORDER BY date ASC;
    `;
  }

  async getRecentTopicAccuracy(studentId: string, days: number = 30): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT COALESCE(t.name, 'General') as topic,
      (SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::float / NULLIF(COUNT(sa.id), 0) * 100) as recent_accuracy_pct
      FROM session_answers sa
      JOIN quiz_sessions qs ON sa.session_id = qs.id
      JOIN questions q ON sa.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE qs.student_id = ${studentId}::uuid AND qs.status = 'completed' AND qs.started_at >= NOW() - interval '1 day' * ${days}::int
      GROUP BY t.name
    `;
  }

  async getWeakTopicsBySM2(studentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        COALESCE(t.name, 'General') as topic,
        COUNT(p.id)::int as total_questions,
        SUM(CASE WHEN p.easiness_factor < 2.0 THEN 1 ELSE 0 END)::int as weak_questions,
        SUM(CASE WHEN p.next_review_date < NOW() - INTERVAL '3 days' THEN 1 ELSE 0 END)::int as overdue_questions,
        ROUND(AVG(p.easiness_factor)::numeric, 2)::float as avg_ef,
        ROUND((SUM(p.correct_attempts)::float / NULLIF(SUM(p.total_attempts), 0) * 100)::numeric, 1)::float as accuracy_pct
      FROM sm2_progress p
      JOIN questions q ON p.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE p.student_id = ${studentId}::uuid
      GROUP BY t.id, t.name
      HAVING SUM(p.total_attempts) >= 3
         AND (AVG(p.easiness_factor) < 2.5 OR SUM(CASE WHEN p.next_review_date < NOW() - INTERVAL '3 days' THEN 1 ELSE 0 END) > 0)
      ORDER BY overdue_questions DESC, avg_ef ASC, weak_questions DESC;
    `;
  }

  async getTopicPerformance(studentId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT 
        t.id as topic_id,
        COALESCE(t.name, 'General') as topic,
        COUNT(p.id)::int as total_questions,
        SUM(CASE WHEN p.easiness_factor >= 2.5 AND p.repetition_count >= 4 AND p.interval_days >= 21 THEN 1 ELSE 0 END)::int as mastered_count,
        SUM(CASE WHEN p.easiness_factor < 1.8 OR p.next_review_date < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END)::int as at_risk_count,
        ROUND(AVG(p.easiness_factor)::numeric, 2)::float as avg_ef,
        ROUND((SUM(p.correct_attempts)::float / NULLIF(SUM(p.total_attempts), 0) * 100)::numeric, 1)::float as accuracy_pct
      FROM sm2_progress p
      JOIN questions q ON p.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE p.student_id = ${studentId}::uuid AND p.total_attempts > 0
      GROUP BY t.id, t.name
      ORDER BY t.name ASC;
    `;
  }

  async getSM2Summary(studentId: string): Promise<any> {
    const rawResult = await this.prisma.$queryRaw<any[]>`
      WITH sm2_data AS (
        SELECT 
          easiness_factor::float,
          repetition_count,
          interval_days,
          next_review_date,
          total_attempts
        FROM sm2_progress sp
        JOIN questions q ON sp.question_id = q.id
        WHERE sp.student_id = ${studentId}::uuid
          AND q.deleted_at IS NULL
      ),
      categorized AS (
        SELECT 
          *,
          CASE 
            WHEN total_attempts = 0 THEN 'new'
            WHEN easiness_factor >= 2.5 AND repetition_count >= 4 AND interval_days >= 21 THEN 'mastered'
            ELSE 'learning'
          END as status,
          CASE 
            WHEN total_attempts > 0 AND NOT (easiness_factor >= 2.5 AND repetition_count >= 4 AND interval_days >= 21)
                 AND (easiness_factor < 1.8 OR next_review_date < NOW() - INTERVAL '7 days') THEN 1
            ELSE 0
          END as is_at_risk,
          CASE 
            WHEN next_review_date <= CURRENT_DATE THEN 1 
            ELSE 0 
          END as is_due_today
        FROM sm2_data
      )
      SELECT 
        COUNT(*)::int as total_questions,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)::int as new_count,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END)::int as learning_count,
        SUM(is_at_risk)::int as learning_at_risk,
        (SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) - SUM(is_at_risk))::int as learning_in_progress,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END)::int as mastered_count,
        SUM(is_due_today)::int as due_today
      FROM categorized;
    `;
    return rawResult[0] || null;
  }

  // --- TEACHER ---
  async getTeacherClassActiveStudents(classId: string, daysAgoStart: number, daysAgoEnd: number = 0): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid 
        AND qs.started_at >= NOW() - INTERVAL '${daysAgoStart} days'
        AND qs.started_at < NOW() - INTERVAL '${daysAgoEnd} days';
    `;
  }

  async getTeacherClassAverageScore(classId: string, daysAgoStart: number, daysAgoEnd: number = 0): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      SELECT COALESCE(AVG(score), 0)::float as avg_score
      FROM quiz_sessions qs
      JOIN assignments a ON a.id = qs.assignment_id
      WHERE a.class_id = ${classId}::uuid AND qs.status = 'completed' 
        AND qs.started_at >= NOW() - INTERVAL '${daysAgoStart} days'
        AND qs.started_at < NOW() - INTERVAL '${daysAgoEnd} days';
    `;
  }

  async getTeacherClassSM2Summary(classId: string): Promise<any> {
    const rawResult = await this.prisma.$queryRaw<any[]>`
      WITH class_students AS (
        SELECT student_id FROM class_members WHERE class_id = ${classId}::uuid AND is_active = true
      ),
      sm2_data AS (
        SELECT 
          sp.easiness_factor::float,
          sp.repetition_count,
          sp.interval_days,
          sp.next_review_date,
          sp.total_attempts
        FROM sm2_progress sp
        JOIN class_students cs ON sp.student_id = cs.student_id
        JOIN questions q ON sp.question_id = q.id
        WHERE q.deleted_at IS NULL
      ),
      categorized AS (
        SELECT 
          *,
          CASE 
            WHEN total_attempts = 0 THEN 'new'
            WHEN easiness_factor >= 2.5 AND repetition_count >= 4 AND interval_days >= 21 THEN 'mastered'
            ELSE 'learning'
          END as status,
          CASE 
            WHEN total_attempts > 0 AND NOT (easiness_factor >= 2.5 AND repetition_count >= 4 AND interval_days >= 21)
                 AND (easiness_factor < 1.8 OR next_review_date < NOW() - INTERVAL '7 days') THEN 1
            ELSE 0
          END as is_at_risk,
          CASE 
            WHEN next_review_date <= CURRENT_DATE THEN 1 
            ELSE 0 
          END as is_due_today
        FROM sm2_data
      )
      SELECT 
        COUNT(*)::int as total_questions,
        SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END)::int as new_count,
        SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END)::int as learning_count,
        SUM(is_at_risk)::int as learning_at_risk,
        (SUM(CASE WHEN status = 'learning' THEN 1 ELSE 0 END) - SUM(is_at_risk))::int as learning_in_progress,
        SUM(CASE WHEN status = 'mastered' THEN 1 ELSE 0 END)::int as mastered_count,
        SUM(is_due_today)::int as due_today
      FROM categorized;
    `;
    return rawResult[0] || null;
  }

  async getTeacherClassTopics(classId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      WITH class_students AS (
        SELECT student_id FROM class_members WHERE class_id = ${classId}::uuid AND is_active = true
      )
      SELECT 
        COALESCE(t.id::text, 'general') as topic_id,
        COALESCE(t.name, 'General') as topic,
        COUNT(sp.id)::int as total_answers,
        ROUND(AVG(sp.easiness_factor)::numeric, 2)::float as avg_ef,
        SUM(CASE WHEN sp.easiness_factor >= 2.5 AND sp.repetition_count >= 4 AND sp.interval_days >= 21 THEN 1 ELSE 0 END)::int as mastered_count,
        SUM(CASE WHEN sp.easiness_factor < 1.8 OR sp.next_review_date < NOW() - INTERVAL '7 days' THEN 1 ELSE 0 END)::int as at_risk_count,
        ROUND((SUM(sp.correct_attempts)::float / NULLIF(SUM(sp.total_attempts), 0) * 100)::numeric, 2)::float as accuracy_pct
      FROM sm2_progress sp
      JOIN class_students cs ON sp.student_id = cs.student_id
      JOIN questions q ON sp.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE sp.total_attempts > 0
      GROUP BY t.id, t.name
      ORDER BY accuracy_pct ASC;
    `;
  }

  async getTeacherClassStudents(classId: string): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      WITH sm2_stats AS (
        SELECT 
          sp.student_id,
          COUNT(sp.id)::int as total_q,
          SUM(CASE WHEN sp.easiness_factor >= 2.5 AND sp.repetition_count >= 4 AND sp.interval_days >= 21 THEN 1 ELSE 0 END)::int as mastered_q,
          ROUND(AVG(sp.easiness_factor)::numeric, 2)::float as avg_ef
        FROM sm2_progress sp
        JOIN questions q ON sp.question_id = q.id
        WHERE sp.total_attempts > 0
        GROUP BY sp.student_id
      ),
      BestScores AS (
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
        WHERE a.class_id = ${classId}::uuid AND qs.status = 'completed'
        GROUP BY qs.student_id, qs.assignment_id
      )
      SELECT 
        u.id as student_id,
        u.full_name as name,
        COALESCE(SUM(bs.best_score), 0)::int as score,
        COALESCE(SUM(bs.attempts), 0)::int as sessions_count,
        ROUND(COALESCE(SUM(bs.total_correct) * 100.0 / NULLIF(SUM(bs.total_questions), 0), 0), 2) as accuracy,
        MAX(bs.last_active) as last_active_at,
        COALESCE(MAX(sm2.total_q), 0)::int as sm2_total_q,
        COALESCE(MAX(sm2.mastered_q), 0)::int as sm2_mastered_q,
        COALESCE(MAX(sm2.avg_ef), 0)::float as sm2_avg_ef
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      LEFT JOIN BestScores bs ON bs.student_id = cm.student_id
      LEFT JOIN sm2_stats sm2 ON sm2.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid AND cm.is_active = true
      GROUP BY u.id, u.full_name
      ORDER BY score DESC
    `;
  }

  async getTeacherClassTopicStudents(classId: string, topicId: string, isGeneral: boolean): Promise<any[]> {
    return this.prisma.$queryRaw<any[]>`
      WITH sm2_topic_stats AS (
        SELECT 
          sp.student_id,
          COUNT(sp.id)::int as topic_total_q,
          SUM(CASE WHEN sp.easiness_factor >= 2.5 AND sp.repetition_count >= 4 AND sp.interval_days >= 21 THEN 1 ELSE 0 END)::int as topic_mastered_q,
          ROUND(AVG(sp.easiness_factor)::numeric, 2)::float as topic_avg_ef
        FROM sm2_progress sp
        JOIN questions q ON sp.question_id = q.id
        WHERE sp.total_attempts > 0
          AND (
            (${isGeneral} AND q.topic_id IS NULL)
            OR (NOT ${isGeneral} AND q.topic_id = ${topicId}::uuid)
          )
        GROUP BY sp.student_id
      ),
      TopicAnswers AS (
        SELECT 
          qs.student_id,
          qs.assignment_id,
          qs.id as session_id,
          SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END) as correct_q_topic,
          COUNT(sa.id) as total_q_topic
        FROM quiz_sessions qs
        JOIN assignments a ON a.id = qs.assignment_id
        JOIN session_answers sa ON sa.session_id = qs.id
        JOIN questions q ON q.id = sa.question_id
        WHERE a.class_id = ${classId}::uuid 
          AND qs.status = 'completed'
          AND (
            (${isGeneral} AND q.topic_id IS NULL)
            OR (NOT ${isGeneral} AND q.topic_id = ${topicId}::uuid)
          )
        GROUP BY qs.student_id, qs.assignment_id, qs.id
      ),
      BestTopicScores AS (
        SELECT 
          student_id,
          assignment_id,
          MAX(CASE WHEN total_q_topic > 0 THEN (correct_q_topic * 100.0 / total_q_topic) ELSE 0 END) as best_score,
          SUM(correct_q_topic) as total_correct,
          SUM(total_q_topic) as total_questions
        FROM TopicAnswers
        GROUP BY student_id, assignment_id
      )
      SELECT 
        u.id as student_id,
        u.full_name as name,
        COALESCE(SUM(bs.best_score), 0)::int as score,
        ROUND(COALESCE(SUM(bs.total_correct) * 100.0 / NULLIF(SUM(bs.total_questions), 0), 0), 2) as accuracy_pct,
        COALESCE(MAX(sm2.topic_total_q), 0)::int as sm2_topic_total_q,
        COALESCE(MAX(sm2.topic_mastered_q), 0)::int as sm2_topic_mastered_q,
        COALESCE(MAX(sm2.topic_avg_ef), 0)::float as sm2_topic_avg_ef
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      LEFT JOIN BestTopicScores bs ON bs.student_id = cm.student_id
      LEFT JOIN sm2_topic_stats sm2 ON sm2.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid AND cm.is_active = true
      GROUP BY u.id, u.full_name
      ORDER BY accuracy_pct ASC, score DESC
    `;
  }

  async countCompletedSessions(studentId: string): Promise<number> {
    return this.prisma.quizSession.count({ where: { student_id: studentId, status: 'completed' } });
  }
  
  async countTotalAnswers(studentId: string): Promise<number> {
    return this.prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' } } });
  }

  async countCorrectAnswers(studentId: string): Promise<number> {
    return this.prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' }, is_correct: true } });
  }

  async findTeacherClass(teacherId: string, classId: string) {
    return this.prisma.class.findFirst({ where: { id: classId, teacher_id: teacherId } });
  }

  async countActiveClassMembers(classId: string): Promise<number> {
    return this.prisma.classMember.count({ where: { class_id: classId, is_active: true } });
  }

  async countClassAssignments(classId: string): Promise<number> {
    return this.prisma.assignment.count({ where: { class_id: classId, deleted_at: null } });
  }

  async findStudentInTeacherClasses(teacherId: string, studentId: string) {
    return this.prisma.classMember.findFirst({
      where: {
        student_id: studentId,
        is_active: true,
        class: { teacher_id: teacherId, deleted_at: null }
      }
    });
  }
}
