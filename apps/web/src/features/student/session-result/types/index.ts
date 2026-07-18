export interface AnswerOption {
  id: string;
  content: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  content: string;
  question_type: string;
  answer_options?: AnswerOption[];
  metadata?: any;
}

export interface SessionAnswer {
  id: string;
  is_correct: boolean;
  selected_option?: string;
  text_answer?: string;
  question: Question;
}

export interface ResultData {
  score: number;
  total_questions?: number;
  answered_questions?: number;
  correct_questions?: number;
  duration_seconds?: number;
  finished_at?: string;
  performance_by_topic?: any[];
  weakest_topic?: string | null;
  next_review_date?: string;
  session_answers?: SessionAnswer[];
}
