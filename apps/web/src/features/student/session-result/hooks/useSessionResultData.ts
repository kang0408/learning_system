import { useSuspenseQuery } from '@tanstack/react-query';
import { studentSessionResultApi } from '../api/studentSessionResultApi';
import type { ResultData } from '../types';

export const useSessionResultData = (sessionId: string | null, initialData: ResultData | null) => {
  return useSuspenseQuery({
    queryKey: ['sessionResult', sessionId],
    queryFn: async () => {
      // If we have initial data (from navigation state), we don't need to fetch if sessionId matches
      // But queryFn requires returning data. If we provide initialData to useSuspenseQuery, it might skip queryFn.
      if (!sessionId) {
        if (initialData) return initialData;
        throw new Error("No session ID or initial data provided");
      }
      return studentSessionResultApi.getResult(sessionId);
    },
    // If initialData is provided, React Query will use it and won't fetch immediately unless stale
    initialData: initialData ? initialData : undefined,
    // Keep it fresh if we just got it from location state
    staleTime: 1000 * 60 * 5, 
  });
};
