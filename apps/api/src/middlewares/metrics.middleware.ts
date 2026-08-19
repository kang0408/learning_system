import { Request, Response, NextFunction } from 'express';

interface RequestRecord {
  timestamp: number;
  durationMs: number;
  statusCode: number;
}

// In-memory rolling window buffer (last 60 seconds)
const requestLog: RequestRecord[] = [];
let activeSseCount = 0;

export const metricsCollectorMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    const statusCode = res.statusCode;
    const now = Date.now();

    requestLog.push({
      timestamp: now,
      durationMs,
      statusCode,
    });

    // Prune entries older than 60 seconds
    const cutoff = now - 60 * 1000;
    while (requestLog.length > 0 && requestLog[0].timestamp < cutoff) {
      requestLog.shift();
    }
  });

  next();
};

export const registerSseConnection = () => {
  activeSseCount++;
};

export const unregisterSseConnection = () => {
  if (activeSseCount > 0) {
    activeSseCount--;
  }
};

export const getApiTrafficMetrics = () => {
  const now = Date.now();
  const cutoff = now - 60 * 1000;
  
  // Filter within last 60s
  const recent = requestLog.filter(r => r.timestamp >= cutoff);
  const total = recent.length;
  const rps = Math.round((total / 60) * 10) / 10;

  let code2xx = 0;
  let code4xx = 0;
  let code5xx = 0;

  const latencies: number[] = [];

  for (const r of recent) {
    latencies.push(r.durationMs);
    if (r.statusCode >= 200 && r.statusCode < 300) {
      code2xx++;
    } else if (r.statusCode >= 400 && r.statusCode < 500) {
      code4xx++;
    } else if (r.statusCode >= 500) {
      code5xx++;
    }
  }

  latencies.sort((a, b) => a - b);
  const p95Index = latencies.length > 0 ? Math.floor(latencies.length * 0.95) : 0;
  const p95LatencyMs = latencies.length > 0 ? latencies[p95Index] : 15;

  let status: 'HEALTHY' | 'WARNING' | 'CRITICAL' = 'HEALTHY';
  if (code5xx > 5 || p95LatencyMs > 1000) {
    status = 'CRITICAL';
  } else if (code5xx > 0 || p95LatencyMs > 350) {
    status = 'WARNING';
  }

  return {
    rps,
    totalRequests1m: total,
    statusCodes: {
      '2xx': code2xx,
      '4xx': code4xx,
      '5xx': code5xx,
    },
    p95LatencyMs,
    activeSseConnections: activeSseCount,
    status,
  };
};
