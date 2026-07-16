export interface Topic {
  id: string;
  name: string;
  description?: string;
  code?: string;
  created_at: string;
  _count?: {
    questions: number;
  };
}

export interface CreateTopicPayload {
  name: string;
  description?: string;
  code?: string;
}

export interface CreateQuestionPayload {
  topic_id?: string;
  question_type: string;
  content: string;
  difficulty: number;
  answer_options: Array<{
    content: string;
    is_correct: boolean;
    order_index: number;
  }>;
}

export interface ImportCsvResult {
  importedCount: number;
  errors: string[];
}
