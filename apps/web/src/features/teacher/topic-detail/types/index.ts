export interface Topic {
  id: string;
  name: string;
  description?: string;
  code?: string;
  created_at: string;
}

export interface QuestionOption {
  content: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  topic_id: string;
  question_type: string;
  content: string;
  explanation?: string;
  difficulty: number;
  answer_options: QuestionOption[];
  metadata?: any;
}

export interface UpdateTopicPayload {
  name: string;
  description?: string;
  code?: string;
}

export interface SaveQuestionPayload {
  topic_id?: string;
  question_type: string;
  content: string;
  difficulty: number;
  explanation?: string;
  answer_options: QuestionOption[];
  metadata?: any;
}

export interface GenerateAiQuestionsPayload {
  topic: string;
  question_type: string;
  quantity: number;
  difficulty?: number;
}

export interface AiGeneratedQuestion {
  content: string;
  question_type: string;
  difficulty: number;
  explanation: string;
  answer_options: {
    content: string;
    is_correct: boolean;
  }[];
  metadata?: any;
}

export interface BulkSaveQuestionsPayload {
  topic_id: string;
  questions: AiGeneratedQuestion[];
}
