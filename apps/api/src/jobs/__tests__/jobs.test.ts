import { remindDueQuestions } from '../remindDueQuestions.job';
import { remindDueAssignments } from '../remindDueAssignments.job';
import { prisma } from '../../lib/prisma';
import { emailQueue } from '../emailQueue';

jest.mock('../emailQueue', () => ({
  emailQueue: {
    add: jest.fn().mockResolvedValue(true),
  },
}));

jest.mock('../../lib/prisma', () => ({
  prisma: {
    sm2Progress: {
      groupBy: jest.fn(),
    },
    assignment: {
      findMany: jest.fn(),
    },
  },
}));

describe('Cron Jobs & Scheduled Tasks Test Suite (Section 4.2.6)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TC_JOB_01: Tác vụ nhắc nhở câu hỏi đến hạn hằng ngày (07:00 AM)', () => {
    it('should scan database for due review questions and trigger notifications', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      (prisma.sm2Progress.groupBy as jest.Mock).mockResolvedValue([
        {
          student_id: 'student-uuid-1',
          _count: { question_id: 5 },
        },
        {
          student_id: 'student-uuid-2',
          _count: { question_id: 3 },
        },
      ]);

      await remindDueQuestions();

      expect(prisma.sm2Progress.groupBy).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Bạn có 5 câu cần ôn hôm nay')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('TC_JOB_02: Tác vụ nhắc nhở hạn chót bài tập (08:00 AM)', () => {
    it('should find assignments due in 24h and queue email reminders to unsubmitted students', async () => {
      const deadline = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
      (prisma.assignment.findMany as jest.Mock).mockResolvedValue([
        {
          id: 'assign-1',
          title: 'Bài tập Thì Hiện Tại Hoàn Thành',
          deadline,
          is_all_students: true,
          class: {
            members: [
              {
                student: {
                  id: 'student-1',
                  email: 'student1@test.com',
                  full_name: 'Nguyen Van A',
                },
              },
              {
                student: {
                  id: 'student-2',
                  email: 'student2@test.com',
                  full_name: 'Tran Van B',
                },
              },
            ],
          },
          quiz_sessions: [
            { student_id: 'student-2' }, // student-2 already completed
          ],
          assigned_students: [],
        },
      ]);

      await remindDueAssignments();

      expect(emailQueue.add).toHaveBeenCalledTimes(1);
      expect(emailQueue.add).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'DEADLINE_REMINDER',
          email: 'student1@test.com',
          studentName: 'Nguyen Van A',
          assignmentTitle: 'Bài tập Thì Hiện Tại Hoàn Thành',
        })
      );
    });
  });
});
