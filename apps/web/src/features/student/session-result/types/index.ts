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
  next_review_date?: string;
  session_answers?: SessionAnswer[];
}
