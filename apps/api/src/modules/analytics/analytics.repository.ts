import { prisma } from '../../lib/prisma';

export class AnalyticsRepository {
  // --- STUDENT ---
  static async getActiveDates(studentId: string): Promise<{date: string}[]> {
    return prisma.$queryRaw<{date: string}[]>`
      SELECT DISTINCT DATE(started_at)::text as date
      FROM quiz_sessions
      WHERE student_id = ${studentId}::uuid AND status = 'completed'
      ORDER BY date DESC;
    `;
  }

  static async getWeeklyActivity(studentId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT DATE(started_at)::text as date, COUNT(id)::int as sessions, SUM(total_q)::int as questions, 
      (SUM(correct_q)::float / NULLIF(SUM(total_q), 0) * 100) as accuracy
      FROM quiz_sessions
      WHERE student_id = ${studentId}::uuid AND status = 'completed' AND started_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY DATE(started_at) ASC;
    `;
  }

  static async getStudentCalendar(studentId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
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

  static async getStudentWeakTopics(studentId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT COALESCE(t.name, 'General') as topic, COUNT(sa.id)::int as total_answers, 
      (SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::float / NULLIF(COUNT(sa.id), 0) * 100) as accuracy_pct
      FROM session_answers sa
      JOIN quiz_sessions qs ON sa.session_id = qs.id
      JOIN questions q ON sa.question_id = q.id
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE qs.student_id = ${studentId}::uuid AND qs.status = 'completed'
      GROUP BY t.name
      HAVING (SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::float / NULLIF(COUNT(sa.id), 0) * 100) < 60
      ORDER BY accuracy_pct ASC;
    `;
  }

  // --- TEACHER ---
  static async getTeacherClassActiveStudents(classId: string, daysAgoStart: number, daysAgoEnd: number = 0): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid 
        AND qs.started_at >= NOW() - INTERVAL '${daysAgoStart} days'
        AND qs.started_at < NOW() - INTERVAL '${daysAgoEnd} days';
    `;
  }

  static async getTeacherClassAverageScore(classId: string, daysAgoStart: number, daysAgoEnd: number = 0): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT COALESCE(AVG(score), 0)::float as avg_score
      FROM quiz_sessions qs
      JOIN assignments a ON a.id = qs.assignment_id
      WHERE a.class_id = ${classId}::uuid AND qs.status = 'completed' 
        AND qs.started_at >= NOW() - INTERVAL '${daysAgoStart} days'
        AND qs.started_at < NOW() - INTERVAL '${daysAgoEnd} days';
    `;
  }

  static async getTeacherClassTopics(classId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT
          COALESCE(t.id::text, 'general') as topic_id,
          COALESCE(t.name, 'General') as topic,
          COUNT(sa.id)::int                                      AS total_answers,
          SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::int    AS correct_answers,
          ROUND(
              SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)
              * 100.0 / NULLIF(COUNT(sa.id), 0), 2
          )                                                      AS accuracy_pct
      FROM class_members cm
      JOIN quiz_sessions qs   ON qs.student_id    = cm.student_id
      JOIN assignments   a    ON a.id             = qs.assignment_id
      JOIN session_answers sa ON sa.session_id   = qs.id
      JOIN questions     q    ON q.id            = sa.question_id
      LEFT JOIN topics t      ON q.topic_id      = t.id
      WHERE
          cm.class_id  = ${classId}::uuid
          AND a.class_id = ${classId}::uuid
          AND qs.status = 'completed'
      GROUP BY t.id, t.name
      ORDER BY accuracy_pct ASC;
    `;
  }

  static async getTeacherClassStudents(classId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
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
        WHERE a.class_id = ${classId}::uuid AND qs.status = 'completed'
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
      WHERE cm.class_id = ${classId}::uuid AND cm.is_active = true
      GROUP BY u.id, u.full_name
      ORDER BY score DESC
    `;
  }

  static async getTeacherClassTopicStudents(classId: string, topicId: string, isGeneral: boolean): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      WITH TopicAnswers AS (
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
        ROUND(COALESCE(SUM(bs.total_correct) * 100.0 / NULLIF(SUM(bs.total_questions), 0), 0), 2) as accuracy_pct
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      JOIN BestTopicScores bs ON bs.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid AND cm.is_active = true
      GROUP BY u.id, u.full_name
      ORDER BY accuracy_pct ASC, score DESC
    `;
  }

  // --- PARENT ---
  static async getParentChildrenStats(parentId: string): Promise<any[]> {
    return prisma.$queryRaw<any[]>`
      SELECT
          u.full_name                                  AS student_name,
          u.id                                         AS student_id,
          COUNT(DISTINCT qs.id)::int                   AS total_sessions,
          COUNT(sa.id)::int                            AS total_answers,
          ROUND(
              SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)
              * 100.0 / NULLIF(COUNT(sa.id), 0), 2
          )                                            AS overall_accuracy,
          COUNT(DISTINCT CASE
              WHEN qs.started_at >= NOW() - INTERVAL '7 days'
              THEN DATE(qs.started_at)
          END)::int                                    AS active_days_this_week
      FROM users u
      JOIN parent_student_links psl ON psl.student_id = u.id
      JOIN quiz_sessions qs         ON qs.student_id  = u.id
      JOIN session_answers sa       ON sa.session_id  = qs.id
      WHERE
          psl.parent_id = ${parentId}::uuid
          AND psl.is_active = TRUE
          AND qs.status = 'completed'
      GROUP BY u.id, u.full_name;
    `;
  }
}
