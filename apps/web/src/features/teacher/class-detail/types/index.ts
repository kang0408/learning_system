export interface ClassDetails {
  id: string;
  name: string;
  description: string;
  subject: string;
  join_code: string;
}

export interface ClassStats {
  totalStudents: number;
  averageAccuracy: number;
  completedAssignments: number;
  activeStudents: number;
}

export interface TopicAccuracy {
  topic_id: string;
  topic: string;
  accuracy: number;
}

export interface ClassAnalytics {
  topic_accuracy: TopicAccuracy[];
  leaderboard: any[];
}

export interface ClassMember {
  id: string;
  student: {
    id: string;
    full_name: string;
    email: string;
  };
  joined_at: string;
}

export interface ClassAssignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  is_published: boolean;
  topic?: { name: string };
  _count?: { submissions: number };
}
