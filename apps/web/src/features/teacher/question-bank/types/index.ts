export interface Topic {
  id: string;
  name: string;
  description?: string;
  code?: string;
  parent_id?: string | null;
  children?: Topic[];
  created_at: string;
  _count?: {
    questions: number;
  };
}

export interface CreateTopicPayload {
  name: string;
  description?: string;
  code?: string;
  parent_id?: string | null;
}

export interface CreateQuestionPayload {
  topic_id?: string;
  question_type: string;
  content: string;
  difficulty: number;
  explanation?: string;
  answer_options: Array<{
    content: string;
    is_correct: boolean;
    order_index: number;
  }>;
  metadata?: any;
}

export interface AiGeneratedTopicData {
  topic_name: string;
  topic_code?: string;
  topic_description?: string;
  questions: Array<{
    content: string;
    question_type: string;
    difficulty: number;
    explanation?: string;
    evidence_quote?: string;
    answer_options?: Array<{
      content: string;
      is_correct: boolean;
      order_index?: number;
    }>;
    metadata?: any;
  }>;
}
