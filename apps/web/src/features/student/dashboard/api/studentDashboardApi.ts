import api from '@/api/axios';
import type { 
  AnalyticsData, 
  Assignment, 
  DailyScheduleClass, 
  WeakTopic, 
  CalendarEvent 
} from '../types';

export const studentDashboardApi = {
  getAnalytics: async (): Promise<AnalyticsData> => {
    const res = await api.get('/api/analytics/student/me');
    return res.data?.data || res.data;
  },
  
  getPendingAssignments: async (): Promise<Assignment[]> => {
    const res = await api.get('/api/assignments/my?status=pending');
    return res.data?.data || res.data;
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
