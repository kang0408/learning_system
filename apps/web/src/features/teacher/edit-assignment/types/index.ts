export interface AssignmentQuestion {
  question_id: string;
  question?: {
    topic_id: string;
  };
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  mode: string;
  max_attempts: number;
  time_limit: number | null;
  is_all_students: boolean;
  assigned_students?: { student_id: string }[];
  assignment_questions?: AssignmentQuestion[];
}

export interface Topic {
  id: string;
  name: string;
  _count?: { questions: number };
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

export interface UpdateAssignmentPayload {
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
