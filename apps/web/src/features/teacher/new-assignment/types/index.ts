export interface Topic {
  id: string;
  name: string;
  code?: string;
  _count?: { questions: number };
  children?: Topic[];
}

export interface Question {
  id: string;
  content: string;
  question_type: string;
  difficulty?: number;
}

export interface ClassMember {
  student: {
    id: string;
    full_name: string;
    email: string;
  };
}

export interface CreateAssignmentPayload {
  class_id: string;
  title: string;
  description: string;
  mode: string;
  max_attempts: number;
  time_limit: number | null;
  deadline: string | null;
  topic_ids: string[];
  question_ids: string[];
  student_ids: string[];
}
