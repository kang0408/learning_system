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
  quiz_sessions?: QuizSession[];
}
