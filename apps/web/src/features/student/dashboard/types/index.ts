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
  title: string;
  deadline: string;
  status: string;
  quiz_sessions?: { status: string }[];
  max_attempts?: number;
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
}

export interface CalendarEvent {
  date: string;
  sessions: number;
}
