import redisClient from '../../lib/redis';

export class AiCacheRepository {
  async get(key: string): Promise<string | null> {
    try {
      if (!redisClient.isOpen) return null;
      return await redisClient.get(key);
    } catch (err) {
      return null;
    }
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    try {
      if (!redisClient.isOpen) return;
      await redisClient.setEx(key, seconds, value);
    } catch (err) {
      // Ignore cache write failures if Redis is offline
    }
  }
}
