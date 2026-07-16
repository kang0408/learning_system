import { useSuspenseQueries } from '@tanstack/react-query';
import { studentDashboardApi } from '../api/studentDashboardApi';

export const useDashboardData = () => {
  const [
    { data: analytics },
    { data: assignments },
    { data: weakTopics },
    { data: dailySchedule }
  ] = useSuspenseQueries({
    queries: [
      {
        queryKey: ['studentAnalytics', 'me'],
        queryFn: studentDashboardApi.getAnalytics,
      },
      {
        queryKey: ['studentAssignments', 'pending'],
        queryFn: studentDashboardApi.getPendingAssignments,
      },
      {
        queryKey: ['studentWeakTopics', 'me'],
        queryFn: studentDashboardApi.getWeakTopics,
      },
      {
        queryKey: ['studentDailySchedule'],
        queryFn: studentDashboardApi.getDailySchedule,
      }
    ]
  });

  return {
    analytics,
    assignments,
    weakTopics,
    dailySchedule
  };
};
