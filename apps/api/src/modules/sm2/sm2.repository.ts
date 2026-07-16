import { PrismaClient } from '@prisma/client';

export class SM2Repository {
  constructor(private readonly prisma: PrismaClient) {}
  async getDueQuestions(studentId: string, assignmentId?: string, limit?: number): Promise<any[]> {
    const limitClause = limit ? `LIMIT ${limit}` : '';
    
    if (assignmentId) {
      return await this.prisma.$queryRawUnsafe<any[]>(`
        SELECT q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty,
               sp.easiness_factor, sp.repetition_count, sp.next_review_date
        FROM sm2_progress sp
        JOIN questions q ON q.id = sp.question_id
        JOIN assignment_questions aq ON aq.question_id = q.id
        WHERE sp.student_id = $1::uuid
          AND aq.assignment_id = $2::uuid
          AND sp.next_review_date <= CURRENT_DATE
          AND q.deleted_at IS NULL
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
        LEFT JOIN assignments a ON a.id = aq.assignment_id
        LEFT JOIN classes c ON c.id = a.class_id
        LEFT JOIN quiz_sessions qs ON qs.assignment_id = a.id AND qs.student_id = ${studentId}::uuid
        WHERE sp.student_id = ${studentId}::uuid
          AND sp.next_review_date <= CURRENT_DATE
          AND q.deleted_at IS NULL
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
        SELECT q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty
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
      SELECT q.id, q.content, q.explanation, q.question_type, q.topic_id, q.difficulty,
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
}
