import api from '@/api/axios';
import type { Topic, CreateTopicPayload, CreateQuestionPayload, AiGeneratedTopicData } from '../types';

export const teacherQuestionBankApi = {
  getClasses: async (): Promise<Array<{ id: string; name: string }>> => {
    const res = await api.get('/api/classes');
    return res.data.data || [];
  },

  getTopics: async (searchTerm: string, classId?: string): Promise<Topic[]> => {
    const params = new URLSearchParams({
      limit: '1000',
      search: searchTerm || '',
    });
    if (classId && classId !== 'all') {
      params.append('class_id', classId);
    }
    const res = await api.get(`/api/topics?${params.toString()}`);
    return (res.data.data || []) as Topic[];
  },

  createTopic: async (payload: CreateTopicPayload): Promise<Topic> => {
    const res = await api.post('/api/topics', payload);
    return res.data.data;
  },

  createQuestion: async (payload: CreateQuestionPayload): Promise<void> => {
    await api.post('/api/questions', payload);
  },

  generateTopicFromDocument: async (
    file: File,
    options?: { question_type?: string; quantity?: number; difficulty?: number }
  ): Promise<AiGeneratedTopicData> => {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.question_type) formData.append('question_type', options.question_type);
    if (options?.quantity) formData.append('quantity', String(options.quantity));
    if (options?.difficulty) formData.append('difficulty', String(options.difficulty));

    const res = await api.post('/api/topics/ai/generate-from-document', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  bulkCreateQuestions: async (topicId: string, questions: any[]): Promise<void> => {
    await api.post('/api/questions/bulk', {
      topic_id: topicId,
      questions
    });
  },

  deleteTopic: async (topicId: string): Promise<void> => {
    await api.delete(`/api/topics/${topicId}`);
  },

  batchDeleteTopics: async (topicIds: string[]): Promise<void> => {
    await api.post('/api/topics/batch-delete', { topicIds });
  }
};
