import { PrismaClient } from '@prisma/client';

export class SM2Repository {
  constructor(private readonly prisma: PrismaClient) {}
  async getDueQuestions(studentId: string, assignmentId?: string, limit?: number): Promise<any[]> {
    try {
      await this.prisma.$executeRaw`
        UPDATE sm2_progress sp
        SET last_reviewed_at = qs.finished_at,
            next_review_date = CURRENT_DATE + INTERVAL '1 day'
        FROM session_answers sa
        JOIN quiz_sessions qs ON qs.id = sa.session_id
        WHERE sp.question_id = sa.question_id
          AND sp.student_id = qs.student_id
          AND qs.student_id = ${studentId}::uuid
          AND qs.status = 'completed'
          AND DATE(qs.finished_at) = CURRENT_DATE
          AND (sp.last_reviewed_at IS NULL OR DATE(sp.last_reviewed_at) < CURRENT_DATE)
      `;
    } catch (e) {
      // ignore sync errors
    }

    const limitClause = limit ? `LIMIT ${limit}` : '';
    
    if (assignmentId) {
      return await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty, q.metadata,
               sp.easiness_factor, sp.repetition_count, sp.next_review_date
        FROM sm2_progress sp
        JOIN questions q ON q.id = sp.question_id
        JOIN assignment_questions aq ON aq.question_id = q.id
        WHERE sp.student_id = $1::uuid
          AND aq.assignment_id = $2::uuid
          AND sp.next_review_date <= CURRENT_DATE
          AND (sp.last_reviewed_at IS NULL OR DATE(sp.last_reviewed_at) < CURRENT_DATE)
          AND q.deleted_at IS NULL
          AND sp.question_id NOT IN (
            SELECT sa.question_id
            FROM session_answers sa
            JOIN quiz_sessions qs ON qs.id = sa.session_id
            WHERE qs.student_id = $1::uuid
              AND qs.status = 'completed'
              AND DATE(qs.finished_at) = CURRENT_DATE
          )
        ORDER BY sp.next_review_date ASC, sp.easiness_factor ASC
        ${limitClause}
      `, studentId, assignmentId);
    }
    
    // For daily schedule
    return await this.prisma.$queryRaw<any[]>`
      WITH RankedDue AS (
        SELECT 
          q.id as question_id, 
          q.question_type, 
          q.difficulty,
          t.name as topic_name,
          c.name as class_name,
          c.id as class_id,
          a.title as assignment_title,
          a.id as assignment_id,
          sp.easiness_factor, 
          sp.repetition_count, 
          sp.next_review_date,
          ROW_NUMBER() OVER (
            PARTITION BY q.id 
            ORDER BY 
              CASE WHEN qs.id IS NOT NULL THEN 0 ELSE 1 END ASC,
              a.created_at ASC
          ) as rn
        FROM sm2_progress sp
        JOIN questions q ON q.id = sp.question_id
        LEFT JOIN topics t ON t.id = q.topic_id
        LEFT JOIN assignment_questions aq ON aq.question_id = q.id
        LEFT JOIN assignments a ON a.id = aq.assignment_id AND a.deleted_at IS NULL AND a.mode != 'exam'
        LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN quiz_sessions qs ON qs.assignment_id = a.id AND qs.student_id = ${studentId}::uuid
        WHERE sp.student_id = ${studentId}::uuid
          AND sp.next_review_date <= CURRENT_DATE
          AND (sp.last_reviewed_at IS NULL OR DATE(sp.last_reviewed_at) < CURRENT_DATE)
          AND q.deleted_at IS NULL
          AND sp.question_id NOT IN (
            SELECT sa.question_id
            FROM session_answers sa
            JOIN quiz_sessions qs ON qs.id = sa.session_id
            WHERE qs.student_id = ${studentId}::uuid
              AND qs.status = 'completed'
              AND DATE(qs.finished_at) = CURRENT_DATE
          )
      )
      SELECT 
        question_id, 
        question_type, 
        difficulty,
        topic_name,
        class_name,
        class_id,
        assignment_title,
        assignment_id,
        easiness_factor, 
        repetition_count, 
        next_review_date
      FROM RankedDue
      WHERE rn = 1
      ORDER BY next_review_date ASC, easiness_factor ASC;
    `;
  }

  async getNewQuestions(studentId: string, assignmentId?: string, limit?: number): Promise<any[]> {
    if (assignmentId) {
      return await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty, q.metadata
        FROM assignment_questions aq
        JOIN questions q ON q.id = aq.question_id
        LEFT JOIN sm2_progress sp ON sp.question_id = q.id AND sp.student_id = $1::uuid
        WHERE aq.assignment_id = $2::uuid
          AND sp.id IS NULL
          AND q.deleted_at IS NULL
        LIMIT $3
      `, studentId, assignmentId, limit || 20);
    }

    // For daily schedule
    return await this.prisma.$queryRaw<any[]>`
      WITH RankedQuestions AS (
        SELECT 
          q.id as question_id, 
          q.question_type, 
          q.difficulty,
          t.name as topic_name,
          c.name as class_name,
          c.id as class_id,
          a.title as assignment_title,
          a.id as assignment_id,
          2.50 as easiness_factor, 
          0 as repetition_count, 
          CURRENT_DATE as next_review_date,
          a.created_at as a_created_at,
          aq.order_index as aq_order_index,
          ROW_NUMBER() OVER (PARTITION BY q.id ORDER BY a.created_at ASC, aq.order_index ASC) as rn
        FROM assignment_questions aq
        JOIN assignments a ON a.id = aq.assignment_id
        JOIN questions q ON q.id = aq.question_id
        LEFT JOIN topics t ON t.id = q.topic_id
        LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN sm2_progress sp ON sp.question_id = q.id AND sp.student_id = ${studentId}::uuid
        LEFT JOIN assignment_students ast ON ast.assignment_id = a.id AND ast.student_id = ${studentId}::uuid
        JOIN class_members cm ON cm.class_id = a.class_id AND cm.student_id = ${studentId}::uuid
        WHERE 
          a.is_published = true 
          AND a.deleted_at IS NULL
          AND a.mode = 'adaptive'
          AND cm.is_active = true
          AND (a.is_all_students = true OR ast.id IS NOT NULL)
          AND sp.id IS NULL
          AND q.deleted_at IS NULL
          AND (a.deadline IS NULL OR a.deadline >= CURRENT_DATE)
      )
      SELECT 
        question_id, 
        question_type, 
        difficulty,
        topic_name,
        class_name,
        class_id,
        assignment_title,
        assignment_id,
        easiness_factor, 
        repetition_count, 
        next_review_date
      FROM RankedQuestions
      WHERE rn = 1
      ORDER BY a_created_at ASC, aq_order_index ASC
      LIMIT 20;
    `;
  }

  async getEarlyReviewQuestions(studentId: string, assignmentId: string): Promise<any[]> {
    return await this.prisma.$queryRawUnsafe<any[]>(`
      SELECT q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty, q.metadata,
             sp.easiness_factor, sp.repetition_count, sp.next_review_date
      FROM sm2_progress sp
      JOIN questions q ON q.id = sp.question_id
      JOIN assignment_questions aq ON aq.question_id = q.id
      WHERE sp.student_id = $1::uuid
        AND aq.assignment_id = $2::uuid
        AND q.deleted_at IS NULL
      ORDER BY sp.next_review_date ASC, sp.easiness_factor ASC
      LIMIT 20;
    `, studentId, assignmentId);
  }

  async getTopicPracticeQuestions(studentId: string, topicId: string, assignmentId?: string, limit: number = 20): Promise<any[]> {
    return await this.prisma.$queryRawUnsafe<any[]>(`
      WITH TopicQuestions AS (
        SELECT 
          q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty, q.metadata,
          COALESCE(sp.easiness_factor, 2.50) as easiness_factor,
          COALESCE(sp.repetition_count, 0) as repetition_count,
          sp.next_review_date,
          COALESCE(sp.total_attempts, 0) as total_attempts,
          COALESCE(sp.correct_attempts, 0) as correct_attempts,
          CASE WHEN $3::uuid IS NOT NULL AND aq.assignment_id = $3::uuid THEN 0 ELSE 1 END as in_current_assignment,
          CASE 
            WHEN sp.easiness_factor < 2.0 THEN 0 
            WHEN sp.total_attempts > 0 AND (sp.correct_attempts::float / sp.total_attempts) < 0.8 THEN 1
            WHEN sp.next_review_date <= CURRENT_DATE THEN 2
            ELSE 3 
          END as priority_rank,
          ROW_NUMBER() OVER (
            PARTITION BY q.id 
            ORDER BY 
              CASE WHEN $3::uuid IS NOT NULL AND aq.assignment_id = $3::uuid THEN 0 ELSE 1 END ASC,
              a.created_at DESC
          ) as rn
        FROM questions q
        JOIN assignment_questions aq ON aq.question_id = q.id
        JOIN assignments a ON a.id = aq.assignment_id AND a.deleted_at IS NULL AND a.is_published = true
        JOIN class_members cm ON cm.class_id = a.class_id AND cm.student_id = $1::uuid AND cm.is_active = true
        LEFT JOIN assignment_students ast ON ast.assignment_id = a.id AND ast.student_id = $1::uuid
        LEFT JOIN sm2_progress sp ON sp.question_id = q.id AND sp.student_id = $1::uuid
        WHERE q.topic_id = $2::uuid
          AND q.deleted_at IS NULL
          AND (a.is_all_students = true OR ast.id IS NOT NULL)
      )
      SELECT id, content, explanation, question_type, topic_id, difficulty, metadata,
             easiness_factor, repetition_count, next_review_date, total_attempts, correct_attempts
      FROM TopicQuestions
      WHERE rn = 1
      ORDER BY in_current_assignment ASC, priority_rank ASC, easiness_factor ASC
      LIMIT $4;
    `, studentId, topicId, assignmentId || null, limit);
  }
}
