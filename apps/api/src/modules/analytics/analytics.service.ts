import { prisma } from '../../lib/prisma';

export class AnalyticsService {
  // --- STUDENT DASHBOARD ---
  static async getStudentDashboard(studentId: string) {
    const totalSessions = await prisma.quizSession.count({ where: { student_id: studentId, status: 'completed' } });
    const totalAnswers = await prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' } } });
    
    const correctAnswers = await prisma.sessionAnswer.count({ where: { session: { student_id: studentId, status: 'completed' }, is_correct: true } });
    const overallAccuracy = totalAnswers > 0 ? (correctAnswers / totalAnswers) * 100 : 0;
    
    const activeDates = await prisma.$queryRaw<{date: string}[]>`
      SELECT DISTINCT DATE(started_at)::text as date
      FROM quiz_sessions
      WHERE student_id = ${studentId}::uuid AND status = 'completed'
      ORDER BY date DESC;
    `;
    
    let currentStreakDays = 0;
    let longestStreakDays = 0;

    if (activeDates.length > 0) {
      const dates = activeDates.map(d => new Date(d.date));
      const today = new Date();
      today.setHours(0,0,0,0);

      // Calculate longest streak
      let currentLen = 1;
      longestStreakDays = 1;
      for (let i = 0; i < dates.length - 1; i++) {
        const diff = Math.floor((dates[i].getTime() - dates[i+1].getTime()) / (1000 * 3600 * 24));
        if (diff === 1) {
          currentLen++;
          if (currentLen > longestStreakDays) longestStreakDays = currentLen;
        } else {
          currentLen = 1;
        }
      }

      // Calculate current streak
      const diffFirst = Math.floor((today.getTime() - dates[0].getTime()) / (1000 * 3600 * 24));
      if (diffFirst <= 1) {
        currentStreakDays = 1;
        for (let i = 0; i < dates.length - 1; i++) {
          const diff = Math.floor((dates[i].getTime() - dates[i+1].getTime()) / (1000 * 3600 * 24));
          if (diff === 1) {
            currentStreakDays++;
          } else {
            break;
          }
        }
      }
    }

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
    return { weak_topics: weakTopics };
  }

  // --- TEACHER DASHBOARD ---
  static async getTeacherClassStats(teacherId: string, classId: string) {
    const classData = await prisma.class.findFirst({ where: { id: classId, teacher_id: teacherId } });
    if (!classData) throw { status: 403, message: 'Forbidden' };

    const totalStudents = await prisma.classMember.count({ where: { class_id: classId, is_active: true } });

    // Current week active
    const activeStudentsResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid AND qs.started_at >= NOW() - INTERVAL '7 days';
    `;
    const currentActive = activeStudentsResult[0]?.active_count || 0;

    // Previous week active
    const prevActiveStudentsResult: any = await prisma.$queryRaw`
      SELECT COUNT(DISTINCT qs.student_id)::int as active_count
      FROM quiz_sessions qs
      JOIN class_members cm ON qs.student_id = cm.student_id
      WHERE cm.class_id = ${classId}::uuid 
        AND qs.started_at >= NOW() - INTERVAL '14 days'
        AND qs.started_at < NOW() - INTERVAL '7 days';
    `;
    const prevActive = prevActiveStudentsResult[0]?.active_count || 0;

    // Averages (current and previous)
    const currentAvg: any = await prisma.$queryRaw`
      SELECT COALESCE(AVG(score), 0)::float as avg_score
      FROM quiz_sessions qs
      JOIN assignments a ON a.id = qs.assignment_id
      WHERE a.class_id = ${classId}::uuid AND qs.status = 'completed' AND qs.started_at >= NOW() - INTERVAL '7 days';
    `;

    const prevAvg: any = await prisma.$queryRaw`
      SELECT COALESCE(AVG(score), 0)::float as avg_score
      FROM quiz_sessions qs
      JOIN assignments a ON a.id = qs.assignment_id
      WHERE a.class_id = ${classId}::uuid AND qs.status = 'completed' 
        AND qs.started_at >= NOW() - INTERVAL '14 days'
        AND qs.started_at < NOW() - INTERVAL '7 days';
    `;

    // Completion Rate (assignments with at least one completed session)
    const totalAssignments = await prisma.assignment.count({ where: { class_id: classId, deleted_at: null } });
    const completionRate = totalStudents > 0 ? Math.round((currentActive / totalStudents) * 100) : 0; 
    const prevCompletionRate = totalStudents > 0 ? Math.round((prevActive / totalStudents) * 100) : 0;

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

  static async getTeacherClassTopics(teacherId: string, classId: string) {
    const topics = await prisma.$queryRaw`
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
    return topics;
  }

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
    return students;
  }

  static async getTeacherClassTopicStudents(teacherId: string, classId: string, topicId: string) {
    const isGeneral = topicId.toLowerCase() === 'general' || topicId.toLowerCase() === 'null';
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
      WHERE cm.class_id = ${classId}::uuid 
        AND a.class_id = ${classId}::uuid
        AND qs.status = 'completed'
        AND (
          (${isGeneral} AND q.topic_id IS NULL)
          OR (NOT ${isGeneral} AND q.topic_id = ${topicId}::uuid)
        )
      GROUP BY u.id, u.full_name
      ORDER BY accuracy_pct ASC, score DESC
    `;
    return students;
  }

  static async getTeacherStudentStats(teacherId: string, studentId: string) {
    // Verify student is in at least one of the teacher's classes
    const membership = await prisma.classMember.findFirst({
      where: {
        student_id: studentId,
        is_active: true,
        class: { teacher_id: teacherId, deleted_at: null }
      }
    });

    if (!membership) {
      throw { status: 403, message: 'Học sinh này không thuộc bất kỳ lớp nào của bạn.' };
    }

    // Combine dashboard, calendar, and weak topics
    const dashboard = await this.getStudentDashboard(studentId);
    const calendar = await this.getStudentCalendar(studentId);
    const weakTopics = await this.getStudentWeakTopics(studentId);

    return {
      ...dashboard,
      ...calendar,
      ...weakTopics
    };
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
