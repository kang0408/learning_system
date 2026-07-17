import { ApiError } from '../../lib/ApiError';
import { AssignmentsRepository } from './assignments.repository';
import { emailQueue } from '../../jobs/emailQueue';

export class AssignmentsService {
  constructor(private readonly assignmentsRepository: AssignmentsRepository) {}
  async createAssignment(data: any, teacherId: string) {
    // Verify class ownership
    const classData = await this.assignmentsRepository.findClassById(data.class_id);
    if (!classData || classData.teacher_id !== teacherId) {
      throw new ApiError(403, 'Forbidden: Class does not belong to you');
    }

    let allQuestionIds: string[] = [];

    if (data.question_ids && data.question_ids.length > 0) {
      allQuestionIds.push(...data.question_ids);
    }

    if (data.topic_ids && data.topic_ids.length > 0) {
      const setQuestions = await this.assignmentsRepository.findQuestionsByTopicIds(data.topic_ids);
      allQuestionIds.push(...setQuestions.map(q => q.id));
    }

    // Remove duplicates
    allQuestionIds = [...new Set(allQuestionIds)];

    if (allQuestionIds.length === 0) {
      throw new ApiError(400, 'Phải chọn ít nhất một câu hỏi hoặc bộ câu hỏi có chứa câu hỏi');
    }

    const isAllStudents = !data.student_ids || data.student_ids.length === 0;

    return this.assignmentsRepository.createAssignment({
        class_id: data.class_id,
        created_by: teacherId,
        title: data.title,
        description: data.description,
        mode: data.mode,
        deadline: data.deadline ? new Date(data.deadline) : null,
        max_attempts: data.max_attempts,
        time_limit: data.time_limit,
        is_all_students: isAllStudents,
        assignment_questions: {
          create: allQuestionIds.map((qId, index) => ({
            question_id: qId,
            order_index: index
          }))
        },
        ...(!isAllStudents && {
          assigned_students: {
            create: data.student_ids.map((sId: string) => ({ student_id: sId }))
          }
        })
      });
  }

  async getAssignments(teacherId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;

    const where: any = { created_by: teacherId, deleted_at: null };
    if (query.class_id) {
      where.class_id = query.class_id;
    }

    if (query.student_id) {
      where.OR = [
        { is_all_students: true },
        { assigned_students: { some: { student_id: query.student_id } } }
      ];
    }

    const assignments = await this.assignmentsRepository.findAssignments(where, (page - 1) * limit, limit);

    const enrichedAssignments = assignments.map(assignment => {
      const uniqueSubmissions = new Set(assignment.quiz_sessions.map(s => s.student_id));
      const submittedCount = uniqueSubmissions.size;
      const totalStudents = assignment.is_all_students 
        ? (assignment.class?._count?.members || 1)
        : (assignment.assigned_students.length || 1);
      
      const submissionRate = Math.min(100, Math.round((submittedCount / Math.max(1, totalStudents)) * 100));

      const completedSessions = assignment.quiz_sessions.filter(s => s.status === 'completed');
      
      // Lấy điểm cao nhất của mỗi học sinh
      const highestScoresByStudent = new Map<string, number>();
      for (const session of completedSessions) {
        const score = Number(session.score || 0);
        const currentMax = highestScoresByStudent.get(session.student_id) ?? -1;
        if (score > currentMax) {
          highestScoresByStudent.set(session.student_id, score);
        }
      }

      const avgScore = highestScoresByStudent.size > 0 
        ? Math.round(Array.from(highestScoresByStudent.values()).reduce((acc, score) => acc + score, 0) / highestScoresByStudent.size)
        : 0;

      const deadlineDate = assignment.deadline ? new Date(assignment.deadline) : null;
      const isOverdue = deadlineDate ? deadlineDate < new Date() : false;
      const isCompleted = submissionRate === 100;

      let status = 'ongoing';
      if (isCompleted) status = 'completed';
      else if (isOverdue) status = 'overdue';

      const { quiz_sessions, class: classData, assigned_students, ...rest } = assignment;
      
      const result: any = {
        ...rest,
        submission_rate: submissionRate,
        submitted_count: submittedCount,
        total_students: totalStudents,
        avg_score: avgScore,
        status: status
      };

      if (query.student_id) {
        const studentSessions = quiz_sessions.filter(s => s.student_id === query.student_id);
        if (studentSessions.length > 0) {
          const completedSessions = studentSessions.filter(s => s.status === 'completed');
          if (completedSessions.length > 0) {
            result.student_status = 'completed';
            // Lấy điểm cao nhất trong các lần làm
            result.student_score = Math.max(...completedSessions.map(s => Number(s.score || 0)));
          } else {
            result.student_status = 'in_progress';
            result.student_score = null;
          }
        } else {
          result.student_status = 'pending';
          result.student_score = null;
        }
      }

      return result;
    });
    
    const total = await this.assignmentsRepository.countAssignments(where);
    return { assignments: enrichedAssignments, meta: { page, limit, total } };
  }

  async getAssignmentById(id: string, userId: string, role: string) {
    const assignment = await this.assignmentsRepository.findAssignmentById(id);

    if (!assignment) throw new ApiError(404, 'Assignment not found');

    if (role === 'teacher' && assignment.created_by !== userId) {
      throw new ApiError(403, 'Forbidden');
    }

    if (role === 'student') {
      const isMember = await this.assignmentsRepository.checkClassMembership(assignment.class_id, userId);
      if (!isMember || !isMember.is_active) throw new ApiError(403, 'Forbidden');
      if (!assignment.is_published) throw new ApiError(403, 'Assignment not published');
      
      if (!assignment.is_all_students) {
        const isAssigned = assignment.assigned_students.some(s => s.student_id === userId);
        if (!isAssigned) throw new ApiError(403, 'Assignment is not assigned to you');
      }
    }

    return assignment;
  }

  async updateAssignment(id: string, teacherId: string, data: any) {
    const assignment = await this.getAssignmentById(id, teacherId, 'teacher');
    
    let questionsToAssignIds: string[] | undefined = undefined;
    if (data.topic_ids || data.question_ids) {
      questionsToAssignIds = [];
      
      if (data.question_ids && data.question_ids.length > 0) {
        questionsToAssignIds.push(...data.question_ids);
      }

      if (data.topic_ids && data.topic_ids.length > 0) {
        const setQuestions = await this.assignmentsRepository.findQuestionsByTopicIds(data.topic_ids);
        questionsToAssignIds.push(...setQuestions.map(q => q.id));
      }

      questionsToAssignIds = [...new Set(questionsToAssignIds)];

      if (questionsToAssignIds.length === 0) {
        throw new ApiError(400, 'Phải chọn ít nhất một câu hỏi hoặc bộ câu hỏi có chứa câu hỏi');
      }
    }

    return this.assignmentsRepository.executeTransaction(async (tx) => {
      if (questionsToAssignIds) {
        await this.assignmentsRepository.deleteAssignmentQuestions(id, tx);
      }

      if (data.student_ids) {
        await this.assignmentsRepository.deleteAssignmentStudents(id, tx);
      }

      const isAllStudents = data.student_ids ? data.student_ids.length === 0 : assignment.is_all_students;

      return this.assignmentsRepository.updateAssignment(id, {
          title: data.title,
          description: data.description,
          mode: data.mode,
          deadline: data.deadline ? new Date(data.deadline) : undefined,
          max_attempts: data.max_attempts,
          time_limit: data.time_limit,
          updated_at: new Date(),
          is_all_students: isAllStudents,
          ...(questionsToAssignIds && {
            assignment_questions: {
              create: questionsToAssignIds.map((qId, index) => ({
                question_id: qId,
                order_index: index
              }))
            }
          }),
          ...(data.student_ids && data.student_ids.length > 0 && {
            assigned_students: {
              create: data.student_ids.map((sId: string) => ({ student_id: sId }))
            }
          })
        }, tx);
    });
  }

  async deleteAssignment(id: string, teacherId: string) {
    await this.getAssignmentById(id, teacherId, 'teacher');
    return this.assignmentsRepository.updateAssignment(id, { deleted_at: new Date() });
  }

  async publishAssignment(id: string, teacherId: string) {
    const assignment = await this.getAssignmentById(id, teacherId, 'teacher');
    const updated = await this.assignmentsRepository.updateAssignment(id, { is_published: true, published_at: new Date(), updated_at: new Date() });
    
    // Push emails to queue (non-blocking)
    const students = await this.assignmentsRepository.getStudentsForAssignment(id);
    for (const student of students) {
      if (student.email) {
        emailQueue.add({
          type: 'NEW_ASSIGNMENT',
          email: student.email,
          studentName: student.full_name,
          assignmentTitle: assignment.title,
          deadline: assignment.deadline
        }).catch(err => console.error('[EmailQueue] Add failed:', err));
      }
    }
    
    return updated;
  }

  async unpublishAssignment(id: string, teacherId: string) {
    await this.getAssignmentById(id, teacherId, 'teacher');
    return this.assignmentsRepository.updateAssignment(id, { is_published: false, updated_at: new Date() });
  }

  async getMyAssignments(studentId: string, query: any) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const status = query.status || 'all';

    const memberClasses = await this.assignmentsRepository.getStudentActiveClasses(studentId);
    
    // Filter by class_id if provided, otherwise use all classes the student is in
    const targetClassIds = query.class_id 
      ? memberClasses.filter(mc => mc.class_id === query.class_id).map(mc => mc.class_id)
      : memberClasses.map(mc => mc.class_id);

    const baseWhere: any = {
      class_id: { in: targetClassIds },
      is_published: true,
      deleted_at: null,
      OR: [
        { is_all_students: true },
        { assigned_students: { some: { student_id: studentId } } }
      ]
    };

    if (status === 'overdue') {
      baseWhere.deadline = { lt: new Date() };
    } else if (status === 'pending') {
      // Must use AND because we already have an OR at the top level
      baseWhere.AND = [
        {
          OR: [
            { deadline: null },
            { deadline: { gte: new Date() } }
          ]
        }
      ];
    }

    const assignments = await this.assignmentsRepository.findStudentAssignments(baseWhere, studentId, (page - 1) * limit, limit);
    
    const total = await this.assignmentsRepository.countAssignments(baseWhere);
    return { assignments, meta: { page, limit, total } };
  }
}
