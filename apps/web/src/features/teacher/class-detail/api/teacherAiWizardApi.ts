import api from '@/api/axios';
import { useAuthStore } from '@/store/authStore';
import type {
  WizardDraft,
  Step1ExtractResult,
  WizardLesson,
  BatchGenResult,
  WizardTopic,
  WizardQuestion,
  CommitWizardResult,
  WizardProgressEvent,
} from '../types/aiWizard.types';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const teacherAiWizardApi = {
  /**
   * 1. Get active draft for this teacher and class
   */
  getActiveDraft: async (classId: string): Promise<WizardDraft | null> => {
    const res = await api.get('/api/ai/wizard/active-draft', {
      params: { class_id: classId },
    });
    return res.data.data?.draft || null;
  },

  /**
   * 2. Step 1: Upload document file or text and extract curriculum outline
   */
  step1Curriculum: async (
    classId: string,
    payload: { file?: File; documentText?: string }
  ): Promise<Step1ExtractResult> => {
    if (payload.file) {
      const formData = new FormData();
      formData.append('class_id', classId);
      formData.append('file', payload.file);
      const res = await api.post('/api/ai/wizard/step1-curriculum', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.data;
    }

    const res = await api.post('/api/ai/wizard/step1-curriculum', {
      class_id: classId,
      document_text: payload.documentText || '',
    });
    return res.data.data;
  },

  /**
   * 3. Save / reorder draft lessons (Cards Drag & Drop and CRUD)
   */
  saveDraftLessons: async (
    classId: string,
    curriculumTitle: string,
    description: string,
    lessons: WizardLesson[]
  ): Promise<{ draft_id: string; lessons: WizardLesson[] }> => {
    const res = await api.patch('/api/ai/wizard/draft/lessons', {
      class_id: classId,
      curriculum_title: curriculumTitle,
      description,
      lessons,
    });
    return res.data.data;
  },

  /**
   * 4. Step 2: Batch Generate Topics & Questions for Lessons
   */
  step2GenerateContent: async (
    classId: string,
    lessonTempIds?: string[]
  ): Promise<BatchGenResult> => {
    const res = await api.post('/api/ai/wizard/step2-generate-content', {
      class_id: classId,
      lesson_temp_ids: lessonTempIds,
    });
    return res.data.data;
  },

  /**
   * 5. Open SSE Real-Time Progress Stream
   */
  createProgressStream: (
    classId: string,
    onEvent: (event: WizardProgressEvent) => void,
    onError?: (err: any) => void
  ): (() => void) => {
    const token = useAuthStore.getState().token || '';
    const url = `${API_BASE}/api/ai/wizard/stream-progress?class_id=${encodeURIComponent(classId)}&token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(url);

    eventSource.addEventListener('unit_started', (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE unit_started event', err);
      }
    });

    eventSource.addEventListener('unit_completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE unit_completed event', err);
      }
    });

    eventSource.addEventListener('unit_error', (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE unit_error event', err);
      }
    });

    eventSource.addEventListener('all_completed', (e) => {
      try {
        const data = JSON.parse(e.data);
        onEvent(data);
      } catch (err) {
        console.error('Failed to parse SSE all_completed event', err);
      }
    });

    eventSource.onerror = (err) => {
      if (onError) onError(err);
    };

    return () => {
      eventSource.close();
    };
  },

  /**
   * 6. Update modal details (Topics + Questions of a specific lesson)
   */
  updateLessonDetail: async (
    classId: string,
    lessonTempId: string,
    topics: WizardTopic[],
    questions: WizardQuestion[]
  ): Promise<void> => {
    await api.patch('/api/ai/wizard/draft/lesson-detail', {
      class_id: classId,
      lesson_temp_id: lessonTempId,
      topics,
      questions,
    });
  },

  /**
   * 7. Regenerate a single question in Modal
   */
  regenerateQuestion: async (
    classId: string,
    lessonTempId: string,
    questionTempId: string,
    instruction?: string
  ): Promise<WizardQuestion> => {
    const res = await api.post('/api/ai/wizard/regenerate-question', {
      class_id: classId,
      lesson_temp_id: lessonTempId,
      question_temp_id: questionTempId,
      instruction,
    });
    return res.data.data?.question;
  },

  /**
   * 8. Commit entire wizard to database via Prisma Transaction
   */
  commitWizard: async (classId: string): Promise<CommitWizardResult> => {
    const res = await api.post('/api/ai/wizard/commit', {
      class_id: classId,
    });
    return res.data.data;
  },

  /**
   * 9. Discard active draft
   */
  deleteDraft: async (classId: string): Promise<void> => {
    await api.delete('/api/ai/wizard/draft', {
      params: { class_id: classId },
    });
  },
};
