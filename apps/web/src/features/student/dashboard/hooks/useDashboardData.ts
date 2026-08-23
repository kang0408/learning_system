import { useSuspenseQueries } from '@tanstack/react-query';
import { studentDashboardApi } from '../api/studentDashboardApi';

export const useDashboardData = () => {
  const [
    { data: analytics },
    { data: assignments },
    { data: weakTopics },
    { data: dailySchedule },
    { data: summary },
    { data: topicsTree }
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
      },
      {
        queryKey: ['studentDashboardSummary', 'me'],
        queryFn: studentDashboardApi.getDashboardSummary,
      },
      {
        queryKey: ['studentTopicsTree', 'me'],
        queryFn: studentDashboardApi.getTopicsTree,
      }
    ]
  });

  return {
    analytics,
    assignments,
    weakTopics,
    dailySchedule,
    summary,
    topicsTree
  };
};

