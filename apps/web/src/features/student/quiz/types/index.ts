export interface AnswerOption {
  id: string;
  content: string;
  is_correct: boolean;
  order_index: number;
}

export interface Question {
  id: string;
  question_type: string;
  content: string;
  topic?: string;
  explanation?: string;
  answer_options?: AnswerOption[];
  metadata?: any;
}

export interface Session {
  id: string;
  status: string;
  assignment_id?: string;
  time_limit_seconds?: number;
  questions?: Question[];
  started_at?: string;
}

export interface AnswerPayload {
  question_id: string;
  response_time_ms: number;
  selected_option_id?: string;
  fill_text?: string;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_option_id?: string;
  fill_blank_correct_text?: string;
  matching_correct_pairs?: string[];
  choice_correct_texts?: string[];
  explanation?: string | null;
}
