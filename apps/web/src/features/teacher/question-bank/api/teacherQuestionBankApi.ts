import api from '@/api/axios';
import type { Topic, CreateTopicPayload, CreateQuestionPayload, ImportCsvResult } from '../types';

export const teacherQuestionBankApi = {
  getTopics: async (searchTerm: string): Promise<Topic[]> => {
    const res = await api.get(`/api/topics?limit=1000&search=${encodeURIComponent(searchTerm)}`);
    return (res.data.data || []) as Topic[];
  },

  createTopic: async (payload: CreateTopicPayload): Promise<void> => {
    await api.post('/api/topics', payload);
  },

  createQuestion: async (payload: CreateQuestionPayload): Promise<void> => {
    await api.post('/api/questions', payload);
  },

  importCsv: async (file: File): Promise<ImportCsvResult> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/api/questions/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  },

  deleteTopic: async (topicId: string): Promise<void> => {
    await api.delete(`/api/topics/${topicId}`);
  },

  batchDeleteTopics: async (topicIds: string[]): Promise<void> => {
    await api.post('/api/topics/batch-delete', { topicIds });
  }
};
