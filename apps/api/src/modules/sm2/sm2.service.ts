import { SM2Repository } from './sm2.repository';

export class SM2Service {
  static async getDailySchedule(studentId: string) {
    // Lấy danh sách câu hỏi cần ôn tập hôm nay (M05)
    // Join với assignment, class để trả về thông tin ngữ cảnh giúp sinh viên biết cần ôn môn nào
    const dueQuestions: any[] = await SM2Repository.getDueQuestions(studentId);

    // 2. Lấy danh sách câu hỏi mới (chưa có trong sm2_progress) từ các bài tập Adaptive đang Active
    const newQuestions: any[] = await SM2Repository.getNewQuestions(studentId);

    const allQuestions = [...dueQuestions, ...newQuestions];

    // Nhóm theo lớp học và bài tập
    const scheduleByClass: Record<string, any> = {};

    for (const q of allQuestions) {
      const classId = q.class_id || 'general';
      const className = q.class_name || 'Khác';
      
      if (!scheduleByClass[classId]) {
        scheduleByClass[classId] = {
          class_id: classId,
          class_name: className,
          total_due: 0,
          assignments: {}
        };
      }
      
      scheduleByClass[classId].total_due++;
      
      const assignId = q.assignment_id || 'general';
      const assignTitle = q.assignment_title || 'Tự do';
      
      if (!scheduleByClass[classId].assignments[assignId]) {
        scheduleByClass[classId].assignments[assignId] = {
          assignment_id: assignId,
          title: assignTitle,
          questions: []
        };
      }
      
      // Chỉ gửi siêu dữ liệu, không gửi nội dung câu hỏi để tránh query nặng
      scheduleByClass[classId].assignments[assignId].questions.push({
        id: q.question_id,
        type: q.question_type,
        topic: q.topic_name,
        difficulty: q.difficulty,
        ef: q.easiness_factor,
        reps: q.repetition_count
      });
    }

    // Chuyển object thành mảng
    const result = Object.values(scheduleByClass).map((c: any) => ({
      class_id: c.class_id,
      class_name: c.class_name,
      total_due: c.total_due,
      assignments: Object.values(c.assignments)
    }));

    return result;
  }
}
