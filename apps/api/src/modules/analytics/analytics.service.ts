import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  // --- STUDENT DASHBOARD ---
  static async getStudentDashboard(studentId: string) {
    const totalSessions = await prisma.quizSession.count({ where: { student_id: studentId, status: 'completed' } });
    const totalAnswers = await prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' } } });
    
    const correctAnswers = await prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' }, is_correct: true } });
    const overallAccuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
    
    const currentStreakDays = 5; // mock
    const longestStreakDays = 12; // mock

    const sm2Progress = await prisma.sm2Progress.findMany({ where: { student_id: studentId } });
    const today = new Date();
    today.setHours(0,0,0,0);
    const questionsDueToday = sm2Progress.filter(p => p.next_review_date <= today).length;
    const masteredQuestions = sm2Progress.filter(p => Number(p.easiness_factor) >= 3.0 && p.repetition_count > 3).length;
    const newQuestions = sm2Progress.filter(p => p.repetition_count === 0).length;
    const learningQuestions = sm2Progress.length - masteredQuestions - newQuestions;

    const weeklyActivity = await prisma.$queryRaw`
      SELECT DATE(started_at)::text as date, COUNT(id)::int as sessions, SUM(total_q)::int as questions, 
      (SUM(correct_q)::float / NULLIF(SUM(total_q), 0) * 100) as accuracy
      FROM quiz_sessions
      WHERE student_id = ${studentId}::uuid AND status = 'completed' AND started_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(started_at)
      ORDER BY DATE(started_at) ASC;
    `;

    return {
      total_sessions: totalSessions,
      total_questions_answered: totalAnswers,
      overall_accuracy: overallAccuracy,
      current_streak_days: currentStreakDays,
      longest_streak_days: longestStreakDays,
      questions_due_today: questionsDueToday,
      mastered_questions: masteredQuestions,
      learning_questions: learningQuestions,
      new_questions: newQuestions,
      weekly_activity: weeklyActivity
    };
  }

  static async getStudentCalendar(studentId: string) {
    return { calendar: [] };
  }

  static async getStudentWeakTopics(studentId: string) {
    const weakTopics = await prisma.$queryRaw`
      SELECT q.topic, COUNT(sa.id)::int as total_answers, 
      (SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::float / NULLIF(COUNT(sa.id), 0) * 100) as accuracy_pct
      FROM session_answers sa
      JOIN quiz_sessions qs ON sa.session_id = qs.id
      JOIN questions q ON sa.question_id = q.id
      WHERE qs.student_id = ${studentId}::uuid AND qs.status = 'completed'
      GROUP BY q.topic
      HAVING (SUM(CASE WHEN sa.is_correct THEN 1 ELSE 0 END)::float / NULLIF(COUNT(sa.id), 0) * 100) < 60
      ORDER BY accuracy_pct ASC;
    `;
    return { weak_topics: weakTopics };
  }

  // --- TEACHER DASHBOARD ---
  static async getTeacherClassStats(teacherId: string, classId: string) {
    const classData = await prisma.class.findFirst({ where: { id: classId, teacher_id: teacherId } });
    if (!classData) throw { status: 403, message: 'Forbidden' };

    const totalStudents = await prisma.classMember.count({ where: { class_id: classId } });
    const activeStudentsResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid AND qs.started_at >= NOW() - INTERVAL '7 days';
    `;

    return {
      class_name: classData.name,
      total_students: totalStudents,
      active_students_this_week: activeStudentsResult[0]?.active_count || 0
    };
  }

  static async getTeacherClassTopics(teacherId: string, classId: string) {
    const topics = await prisma.$queryRaw`
      SELECT
          q.topic,
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
      WHERE
          cm.class_id  = ${classId}::uuid
          AND a.class_id = ${classId}::uuid
          AND qs.status = 'completed'
      GROUP BY q.topic
      ORDER BY accuracy_pct ASC;
    `;
    return topics;
  }

  static async getTeacherClassStudents(teacherId: string, classId: string) {
    return { students: [] };
  }

  // --- PARENT DASHBOARD ---
  static async getParentChildren(parentId: string) {
    const children = await prisma.$queryRaw`
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
    return children;
  }

  static async getParentChildWeekly(parentId: string, studentId: string) {
    return { weekly_report: "Report data" };
  }
}
