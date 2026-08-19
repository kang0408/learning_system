export interface SystemMetrics {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  realtime: {
    activeQuizSessionsNow: number;
    recentActiveUsers15m: number;
  };
  users: {
    total: number;
    active: number;
    byRole: Record<string, number>;
  };
  content: {
    classes: number;
    questions: number;
    quizSessions: number;
  };
  database: {
    databaseSize: string;
    activeConnections: number;
  };
  server: {
    uptimeSeconds: number;
    memory: {
      rssMB: number;
      heapTotalMB: number;
      heapUsedMB: number;
    };
    cpuUsageUserMs: number;
    cpuUsageSystemMs: number;
    nodeVersion: string;
    platform: string;
  };
}
