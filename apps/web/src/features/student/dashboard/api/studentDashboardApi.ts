import api from '@/api/axios';
import type { 
  AnalyticsData, 
  Assignment, 
  DailyScheduleClass, 
  WeakTopic, 
  CalendarEvent,
  DashboardSummary,
  HierarchicalTopicNode
} from '../types';

export interface AssignmentQueryParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'pending' | 'overdue' | 'completed';
  class_id?: string;
  topic_id?: string;
  search?: string;
  sort_by?: 'created_desc' | 'deadline_asc' | 'title_asc';
}

export interface PaginatedAssignmentsResponse {
  assignments: Assignment[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export const studentDashboardApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await api.get('/api/analytics/student/me');
    return res.data?.data || res.data;
  },

  getDashboardSummary: async (): Promise<DashboardSummary> => {
    const res = await api.get('/api/analytics/student/me/dashboard-summary');
    return res.data?.data || res.data;
  },

  getTopicsTree: async (): Promise<HierarchicalTopicNode[]> => {
    const res = await api.get('/api/analytics/student/me/topics-tree');
    return res.data?.data || res.data;
  },
  
  getPendingAssignments: async (): Promise<Assignment[]> => {
    const res = await api.get('/api/assignments/my?status=pending&limit=50');
    const data = res.data?.data || res.data;
    return data.assignments || data || [];
  },

  getFilteredAssignments: async (params: AssignmentQueryParams): Promise<PaginatedAssignmentsResponse> => {
    const query = new URLSearchParams();
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.class_id) query.append('class_id', params.class_id);
    if (params.topic_id) query.append('topic_id', params.topic_id);
    if (params.search) query.append('search', params.search);
    if (params.sort_by) query.append('sort_by', params.sort_by);

    const res = await api.get(`/api/assignments/my?${query.toString()}`);
    const data = res.data?.data || res.data;
    return {
      assignments: data.assignments || [],
      meta: data.meta || { page: 1, limit: 20, total: 0, total_pages: 1 }
    };
  },
  
  getWeakTopics: async (): Promise<WeakTopic[]> => {
    const res = await api.get('/api/analytics/student/me/weak-topics');
    const data = res.data?.data || res.data;
    return data.weak_topics || [];
  },
  
  getCalendar: async (): Promise<CalendarEvent[]> => {
    const res = await api.get('/api/analytics/student/me/calendar');
    const data = res.data?.data || res.data;
    return data.calendar || [];
  },
  
  getDailySchedule: async (): Promise<DailyScheduleClass[]> => {
    const res = await api.get('/api/sm2/daily-schedule');
    return res.data?.data || [];
  }
};
