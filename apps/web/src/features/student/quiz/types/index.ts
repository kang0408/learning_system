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

export interface SessionAnswerItem {
  question_id: string;
  selected_option?: string | null;
  text_answer?: string | null;
}

export interface Session {
  id: string;
  status: string;
  assignment_id?: string;
  assignment_title?: string;
  assignment_mode?: string;
  mode?: string;
  time_limit_seconds?: number | null;
  remaining_seconds?: number | null;
  questions?: Question[];
  started_at?: string;
  existing_answers?: SessionAnswerItem[];
  answers?: SessionAnswerItem[];
  is_resumed?: boolean;
}

export interface AnswerPayload {
  question_id: string;
  response_time_ms: number;
  selected_option_id?: string;
  selected_option_ids?: string[];
  fill_text?: string;
  matching_pairs?: any[];
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_option_id?: string;
  fill_blank_correct_text?: string;
  matching_correct_pairs?: string[];
  choice_correct_texts?: string[];
  explanation?: string | null;
}
