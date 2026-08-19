import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../../store/authStore';
import api from '../../../../api/axios';
import type { SystemMetrics } from '../types';

export function useSystemAnalytics() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuthStore();

  useEffect(() => {
    // 1. Initial REST Snapshot fetch
    api.get('/api/analytics/admin/system')
      .then((res: any) => {
        if (res.data?.data) {
          setMetrics(res.data.data);
        }
      })
      .catch((err: any) => {
        console.error('Failed REST metrics snapshot:', err);
        setError('Không thể tải dữ liệu snapshot hệ thống');
      })
      .finally(() => setLoading(false));

    // 2. Connect to SSE Stream if token exists
    if (!token) return;

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const sseUrl = `${apiUrl}/api/analytics/admin/system/stream?token=${encodeURIComponent(token)}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setIsLiveStream(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        setMetrics(data);
      } catch (e) {
        console.error('Failed to parse SSE data:', e);
      }
    };

    eventSource.onerror = (err) => {
      console.warn('SSE Connection disconnected:', err);
      setIsLiveStream(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [token]);

  return { metrics, loading, isLiveStream, error };
}
