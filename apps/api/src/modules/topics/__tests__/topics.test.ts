import { TopicsService } from '../topics.service';
import { ApiError } from '../../../lib/ApiError';

describe('TopicsService (UC-08: Quản lý chủ đề)', () => {
  let topicsService: TopicsService;
  let mockTopicsRepo: any;

  const mockTeacherId = 'teacher-uuid-1';

  beforeEach(() => {
    mockTopicsRepo = {
      findTopic: jest.fn(),
      findTopicById: jest.fn(),
      createTopic: jest.fn(),
      findAllTopicsForTree: jest.fn(),
      updateTopic: jest.fn(),
      deleteTopicWithQuestions: jest.fn(),
      deleteTopicsWithQuestionsBatch: jest.fn(),
    };
    topicsService = new TopicsService(mockTopicsRepo);
  });

  describe('createTopic', () => {
    it('should auto-generate a 6-character uppercase alphanumeric code if code is not provided', async () => {
      mockTopicsRepo.findTopic.mockResolvedValue(null);
      mockTopicsRepo.createTopic.mockImplementation((data: any) => Promise.resolve({ id: 'topic-1', ...data }));

      const result = await topicsService.createTopic(
        { name: 'Từ vựng N3', description: 'Từ vựng tiếng Nhật N3' },
        mockTeacherId
      );

      expect(result.code).toBeDefined();
      expect(result.code).toHaveLength(6);
      expect(result.code).toMatch(/^[A-Z0-9]{6}$/);
      expect(mockTopicsRepo.createTopic).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Từ vựng N3',
          code: expect.stringMatching(/^[A-Z0-9]{6}$/),
          created_by: mockTeacherId,
        })
      );
    });

    it('should throw ApiError if provided custom code already exists', async () => {
      mockTopicsRepo.findTopic.mockResolvedValue({ id: 'existing-topic', code: 'VOCAB1' });

      await expect(
        topicsService.createTopic(
          { name: 'Chủ đề mới', code: 'VOCAB1' },
          mockTeacherId
        )
      ).rejects.toThrow(new ApiError(400, 'Mã topic này đã tồn tại!'));
    });

    it('should throw ApiError if parent_id does not exist or belongs to another teacher', async () => {
      mockTopicsRepo.findTopic.mockResolvedValue(null);
      mockTopicsRepo.findTopicById.mockResolvedValue({ id: 'parent-1', created_by: 'another-teacher' });

      await expect(
        topicsService.createTopic(
          { name: 'Chủ đề con', parent_id: 'parent-1' },
          mockTeacherId
        )
      ).rejects.toThrow(new ApiError(400, 'Topic cha không hợp lệ'));
    });
  });

  describe('getTopics', () => {
    it('should organize flat list of topics into a hierarchical tree with roots and children', async () => {
      const flatTopics = [
        { id: 'root-1', name: 'Ngữ pháp N3', parent_id: null, created_by: mockTeacherId, questions: [] },
        { id: 'child-1', name: 'Mẫu câu điều kiện', parent_id: 'root-1', created_by: mockTeacherId, questions: [] },
        { id: 'child-2', name: 'Mẫu câu bị động', parent_id: 'root-1', created_by: mockTeacherId, questions: [] },
        { id: 'root-2', name: 'Kanji N3', parent_id: null, created_by: mockTeacherId, questions: [] },
      ];
      mockTopicsRepo.findAllTopicsForTree.mockResolvedValue(flatTopics);

      const result = await topicsService.getTopics(mockTeacherId, {});

      expect(result.topics).toHaveLength(2); // root-1 and root-2
      const root1 = result.topics.find((t: any) => t.id === 'root-1');
      expect(root1.children).toHaveLength(2);
      expect(root1.children.map((c: any) => c.id)).toEqual(['child-1', 'child-2']);
      const root2 = result.topics.find((t: any) => t.id === 'root-2');
      expect(root2.children).toHaveLength(0);
    });

    it('should compute cumulative question counts for parent topics from their descendants', async () => {
      const flatTopics = [
        { id: 'root-1', name: 'Ngữ pháp', parent_id: null, created_by: mockTeacherId, _count: { questions: 2 } },
        { id: 'child-1', name: 'Mẫu câu điều kiện', parent_id: 'root-1', created_by: mockTeacherId, _count: { questions: 5 } },
        { id: 'child-2', name: 'Mẫu câu bị động', parent_id: 'root-1', created_by: mockTeacherId, _count: { questions: 3 } },
      ];
      mockTopicsRepo.findAllTopicsForTree.mockResolvedValue(flatTopics);

      const result = await topicsService.getTopics(mockTeacherId, {});

      const root1 = result.topics.find((t: any) => t.id === 'root-1');
      expect(root1._count.questions).toBe(10); // 2 direct + 5 + 3
      expect(root1._count.direct_questions).toBe(2);
    });
  });

  describe('updateTopic', () => {
    it('should throw ApiError when topic is set as its own parent', async () => {
      mockTopicsRepo.findTopicById.mockResolvedValue({ id: 'topic-1', created_by: mockTeacherId });

      await expect(
        topicsService.updateTopic('topic-1', mockTeacherId, {
          name: 'Cập nhật',
          parent_id: 'topic-1',
        })
      ).rejects.toThrow(new ApiError(400, 'Topic không thể tự làm cha của chính nó'));
    });

    it('should successfully update topic when valid', async () => {
      mockTopicsRepo.findTopicById.mockResolvedValue({ id: 'topic-1', created_by: mockTeacherId });
      mockTopicsRepo.updateTopic.mockResolvedValue({ id: 'topic-1', name: 'Tên mới' });

      const res = await topicsService.updateTopic('topic-1', mockTeacherId, { name: 'Tên mới' });
      expect(mockTopicsRepo.updateTopic).toHaveBeenCalledWith(
        'topic-1',
        expect.objectContaining({ name: 'Tên mới' })
      );
      expect(res.name).toBe('Tên mới');
    });
  });

  describe('deleteTopic', () => {
    it('should delete topic and its descendant hierarchy', async () => {
      mockTopicsRepo.findTopicById.mockResolvedValue({ id: 'topic-1', created_by: mockTeacherId });
      mockTopicsRepo.deleteTopicWithQuestions.mockResolvedValue({ count: 3 });

      const res = await topicsService.deleteTopic('topic-1', mockTeacherId);

      expect(mockTopicsRepo.deleteTopicWithQuestions).toHaveBeenCalledWith('topic-1', mockTeacherId);
      expect(res).toEqual({ success: true, count: 3 });
    });
  });
});
