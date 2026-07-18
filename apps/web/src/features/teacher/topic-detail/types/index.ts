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
  question_type: 'multiple_choice' | 'true_false';
  content: string;
  explanation?: string;
  difficulty: number;
  answer_options: QuestionOption[];
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
}

export interface GenerateAiQuestionsPayload {
  topic: string;
  question_type: 'multiple_choice' | 'true_false' | 'mixed';
  quantity: number;
  difficulty?: number;
}

export interface AiGeneratedQuestion {
  content: string;
  question_type: 'multiple_choice' | 'true_false';
  difficulty: number;
  explanation: string;
  answer_options: {
    content: string;
    is_correct: boolean;
  }[];
}

export interface BulkSaveQuestionsPayload {
  topic_id: string;
  questions: AiGeneratedQuestion[];
}
