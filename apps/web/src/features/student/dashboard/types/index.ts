export interface SM2Summary {
  total_questions: number;
  new: { count: number; pct: number };
  learning: { count: number; pct: number; at_risk: number; in_progress: number };
  mastered: { count: number; pct: number };
  due_today: number;
}

export interface AnalyticsData {
  questions_due_today: number;
  total_questions_answered: number;
  overall_accuracy: number;
  current_streak_days: number;
  weekly_activity: { date: string; sessions: number }[];
  sm2_summary?: SM2Summary;
}

export interface Assignment {
  id: string;
  class_id?: string;
  title: string;
  deadline?: string | null;
  status?: string;
  max_attempts?: number;
  class?: { id: string; name: string; subject?: string };
  quiz_sessions?: { id?: string; status: string; score?: number }[];
  assignment_questions?: {
    question: {
      id: string;
      topic_id?: string | null;
      topic?: { id: string; name: string } | null;
    };
  }[];
}

export interface PriorityAssignment extends Assignment {
  attempts_count?: number;
  is_locked?: boolean;
  is_completed?: boolean;
  is_overdue?: boolean;
  is_due_soon?: boolean;
  priority_score?: number;
}

export interface DashboardSummary {
  urgent_count: number;
  due_today_count: number;
  stats: {
    total_questions_answered: number;
    overall_accuracy: number;
    current_streak_days: number;
  };
  priority_assignments: PriorityAssignment[];
  top_weak_topics: WeakTopic[];
}

export interface HierarchicalTopicNode {
  id: string;
  name: string;
  parent_id: string | null;
  description?: string | null;
  total_questions: number;
  mastered_count: number;
  weak_count: number;
  accuracy_pct: number;
  status: 'WEAK' | 'STABLE' | 'MASTERED';
  children: HierarchicalTopicNode[];
}

export interface DailyScheduleAssignment {
  assignment_id: string;
  title: string;
}

export interface DailyScheduleClass {
  class_name: string;
  total_due: number;
  assignments: DailyScheduleAssignment[];
}

export interface WeakTopic {
  topic: string;
  trend: 'improving' | 'declining' | 'stable';
  weak_questions: number;
  overdue_questions: number;
  avg_ef: number;
  accuracy_pct?: number;
}

export interface CalendarEvent {
  date: string;
  sessions: number;
}

