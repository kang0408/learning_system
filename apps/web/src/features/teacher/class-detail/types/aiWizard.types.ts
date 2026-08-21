export type QuestionType =
  | 'multiple_choice'
  | 'multi_select'
  | 'true_false'
  | 'fill_blank'
  | 'matching';

export type LessonCardStatus = 'pending' | 'processing' | 'ready' | 'error';

export interface AnswerOption {
  content: string;
  is_correct: boolean;
  order_index: number;
}

export interface MatchingPair {
  leftText: string;
  rightText: string;
}

export interface QuestionMetadata {
  pairs?: MatchingPair[];
  [key: string]: any;
}

export interface WizardQuestion {
  temp_id: string;
  topic_temp_id: string;
  content: string;
  question_type: QuestionType;
  difficulty: number;
  evidence_quote?: string;
  explanation?: string;
  answer_options: AnswerOption[];
  metadata?: QuestionMetadata;
}

export interface WizardTopic {
  temp_id: string;
  name: string;
  description?: string;
}

export interface WizardLesson {
  temp_id: string;
  title: string;
  summary?: string;
  order_index: number;
  page_range?: string;
  status: LessonCardStatus;
  topics_count: number;
  questions_count: number;
}

export interface WizardDraftPayload {
  curriculum_title: string;
  description?: string;
  lessons: WizardLesson[];
  topicsByLesson: Record<string, WizardTopic[]>;
  questionsByLesson: Record<string, WizardQuestion[]>;
  textChunks?: Record<string, string>;
}

export interface WizardDraft {
  id: string;
  teacher_id: string;
  class_id: string;
  step: 'curriculum_ready' | 'generating' | 'ready_for_review';
  document_name: string | null;
  payload: WizardDraftPayload;
  created_at: string;
  updated_at: string;
}

export interface WizardProgressEvent {
  type: 'unit_started' | 'unit_completed' | 'all_completed' | 'unit_error';
  class_id: string;
  lesson_temp_id?: string;
  progress_pct: number;
  topics?: WizardTopic[];
  questions?: WizardQuestion[];
  error?: string;
}

export interface Step1ExtractResult {
  draft_id: string;
  curriculum_title: string;
  description: string;
  lessons: WizardLesson[];
}

export interface BatchGenResult {
  lessons: WizardLesson[];
  topicsByLesson: Record<string, WizardTopic[]>;
  questionsByLesson: Record<string, WizardQuestion[]>;
}

export interface CommitWizardResult {
  curriculums_created: number;
  topics_created: number;
  questions_created: number;
  assignments_created: number;
  message: string;
}
