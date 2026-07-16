import api from '@/api/axios';
import type { Topic, Question, UpdateTopicPayload, SaveQuestionPayload } from '../types';

export const teacherTopicDetailApi = {
  getTopic: async (topicId: string): Promise<Topic> => {
    const res = await api.get(`/api/questions/topics/${topicId}`);
    return res.data.data;
  },

  getAllTopics: async (): Promise<Topic[]> => {
    const res = await api.get('/api/questions/topics?limit=1000');
    return res.data.data || [];
  },

  getQuestions: async (topicId: string, searchTerm: string): Promise<Question[]> => {
    const res = await api.get(`/api/questions?topic_id=${topicId}&limit=1000&search=${encodeURIComponent(searchTerm)}`);
    return res.data.data || [];
  },

  updateTopic: async (topicId: string, payload: UpdateTopicPayload): Promise<void> => {
    await api.put(`/api/questions/topics/${topicId}`, payload);
  },

  deleteTopic: async (topicId: string): Promise<void> => {
    await api.delete(`/api/questions/topics/${topicId}`);
  },

  createQuestion: async (payload: SaveQuestionPayload): Promise<void> => {
    await api.post('/api/questions', payload);
  },

  updateQuestion: async (questionId: string, payload: SaveQuestionPayload): Promise<void> => {
    await api.put(`/api/questions/${questionId}`, payload);
  },

  deleteQuestion: async (questionId: string): Promise<void> => {
    await api.delete(`/api/questions/${questionId}`);
  }
};
