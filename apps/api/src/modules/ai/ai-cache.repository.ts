import redisClient from '../../lib/redis';

export class AiCacheRepository {
  async get(key: string): Promise<string | null> {
    return redisClient.get(key);
  }

  async setEx(key: string, seconds: number, value: string): Promise<void> {
    await redisClient.setEx(key, seconds, value);
  }
}
