export interface SubsystemCheck {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  message?: string;
  latencyMs?: number;
  [key: string]: any;
}

export interface AiOpsMetrics {
  totalReportsGenerated: number;
  totalAiQuestions: number;
  estimatedTokensUsed: number;
  averageLatencyMs: number;
  errorRatePct: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface ApiTrafficMetrics {
  rps: number;
  totalRequests1m: number;
  statusCodes: {
    '2xx': number;
    '4xx': number;
    '5xx': number;
  };
  p95LatencyMs: number;
  activeSseConnections: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface DatabaseDeepMetrics {
  cacheHitRatioPct: number;
  activeTransactions: number;
  slowQueriesCount: number;
  databaseSize: string;
  activeConnections: number;
  latencyMs: number;
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}

export interface SystemMetrics {
  status: 'HEALTHY' | 'WARNING' | 'CRITICAL';
  timestamp: string;
  checks?: {
    database: SubsystemCheck;
    memory: SubsystemCheck;
    ai?: SubsystemCheck;
    api?: SubsystemCheck;
  };
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
    latencyMs?: number;
  };
  aiOps?: AiOpsMetrics;
  apiTraffic?: ApiTrafficMetrics;
  databaseDeep?: DatabaseDeepMetrics;
  server: {
    uptimeSeconds: number;
    memory: {
      rssMB: number;
      heapTotalMB: number;
      heapUsedMB: number;
      heapUsagePct?: number;
    };
    cpuUsageUserMs: number;
    cpuUsageSystemMs: number;
    nodeVersion: string;
    platform: string;
  };
}
