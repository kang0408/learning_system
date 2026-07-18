export interface StudentStats {
  total_sessions: number;
  total_questions_answered: number;
  overall_accuracy: number;
  current_streak_days: number;
  sm2_summary?: {
    total_questions: number;
    due_today: number;
    mastered: { count: number; pct: number };
    learning: { count: number; pct: number; at_risk: number };
    new: { count: number; pct: number };
  };
  weak_topics?: Array<{
    topic: string;
    accuracy_pct: number;
    recent_accuracy_pct?: number;
    trend?: 'stable' | 'improving' | 'declining';
  }>;
  topic_performance?: Array<{
    topic_id: string | null;
    topic: string;
    topic_path: string;
    total_questions: number;
    mastered_count: number;
    at_risk_count: number;
    avg_ef: number;
    accuracy_pct: number;
  }>;
}

export interface StudentAssignment {
  id: string;
  title: string;
  is_published: boolean;
  student_status: 'completed' | 'in_progress' | 'pending';
  student_score?: number;
  session_id?: string;
  deadline?: string;
  is_all_students: boolean;
}

export interface StudentInfo {
  id: string;
  full_name: string;
  email: string;
  avatar_url?: string;
}

export interface TeacherStudentDetailData {
  stats: StudentStats;
  assignments: StudentAssignment[];
  studentInfo: StudentInfo | null;
}
