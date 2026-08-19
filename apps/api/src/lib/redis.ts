import { createClient } from 'redis';

let isConnected = false;

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  socket: {
    connectTimeout: 2000,
    reconnectStrategy: (retries) => {
      if (retries > 2) {
        // Stop retrying to avoid console log spam on Windows when Redis is not running
        return new Error('Redis server unreachable');
      }
      return 1000;
    },
  },
});

redisClient.on('connect', () => {
  isConnected = true;
  console.log('✅ Connected to Redis Server');
});

redisClient.on('error', (err) => {
  if (!isConnected) {
    // Suppress repeated connection timeout logs when Redis is offline locally
    return;
  }
  console.warn('Redis Client Warning:', err.message);
});

redisClient.connect().catch(() => {
  // Gracefully ignore error if local Redis server is not running
});

export default redisClient;
