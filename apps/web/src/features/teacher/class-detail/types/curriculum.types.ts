export interface CurriculumMaterial {
  id?: string;
  title: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  order_index?: number;
}

export interface CurriculumAssignmentItem {
  id: string;
  assignment_id: string;
  order_index: number;
  assignment: {
    id: string;
    title: string;
    mode: 'adaptive' | 'standard' | 'exam' | string;
    deadline?: string | null;
    max_attempts?: number;
    time_limit?: number | null;
    is_published: boolean;
    _count?: {
      assignment_questions: number;
    };
  };
}

export interface ClassCurriculum {
  id: string;
  class_id: string;
  title: string;
  content_html: string;
  video_url?: string | null;
  video_type?: 'youtube' | 'drive' | 'vimeo' | 'direct' | 'embed' | string | null;
  order_index: number;
  is_published: boolean;
  materials?: CurriculumMaterial[];
  assignments?: CurriculumAssignmentItem[];
  created_at: string;
  updated_at?: string;
}

export interface CreateCurriculumPayload {
  title: string;
  content_html: string;
  video_url?: string | null;
  video_type?: string | null;
  is_published?: boolean;
  materials?: CurriculumMaterial[];
  assignment_ids?: string[];
}

export interface UpdateCurriculumPayload {
  title?: string;
  content_html?: string;
  video_url?: string | null;
  video_type?: string | null;
  is_published?: boolean;
  materials?: CurriculumMaterial[];
  assignment_ids?: string[];
}

export interface ReorderCurriculumItem {
  id: string;
  order_index: number;
}
