export interface Teacher {
  id?: string;
  full_name?: string;
}

export interface ClassDetailData {
  id: string;
  name: string;
  description?: string;
  teacher?: Teacher;
}

export interface QuizSession {
  id: string;
  status: string;
  score: number;
}

export interface AssignmentItem {
  id: string;
  title: string;
  description?: string;
  deadline?: string;
  max_attempts?: number;
  created_at?: string;
  quiz_sessions?: QuizSession[];
  curriculum_assignments?: Array<{
    order_index?: number;
    curriculum?: {
      id: string;
      title: string;
      order_index: number;
    };
  }>;
}

export type * from './curriculum.types';
