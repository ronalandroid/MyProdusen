import { getRedisClient } from './redis';
import { logger } from '../logger';
import { CACHE_ENABLED, DEFAULT_CACHE_TTL, CacheOptions } from './cache-strategies';

export class CacheManager {
  private enabled: boolean;

  constructor() {
    this.enabled = CACHE_ENABLED;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled) return null;

    try {
      const redis = getRedisClient();
      const value = await redis.get(key);
      
      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      logger.error('Cache get error', { key, error });
      return null;
    }
  }

  async set(key: string, value: unknown, options?: CacheOptions): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const redis = getRedisClient();
      const ttl = options?.ttl || DEFAULT_CACHE_TTL;
      const serialized = JSON.stringify(value);

      await redis.setex(key, ttl, serialized);
      
      if (options?.tags && options.tags.length > 0) {
        await this.addToTags(key, options.tags);
      }

      return true;
    } catch (error) {
      logger.error('Cache set error', { key, error });
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const redis = getRedisClient();
      await redis.del(key);
      return true;
    } catch (error) {
      logger.error('Cache delete error', { key, error });
      return false;
    }
  }

  async deletePattern(pattern: string): Promise<number> {
    if (!this.enabled) return 0;

    try {
      const redis = getRedisClient();
      const keys = await redis.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      await redis.del(...keys);
      return keys.length;
    } catch (error) {
      logger.error('Cache delete pattern error', { pattern, error });
      return 0;
    }
  }

  async invalidateByTag(tag: string): Promise<number> {
    if (!this.enabled) return 0;

    try {
      const redis = getRedisClient();
      const tagKey = `tag:${tag}`;
      const keys = await redis.smembers(tagKey);
      
      if (keys.length === 0) {
        return 0;
      }

      await redis.del(...keys);
      await redis.del(tagKey);
      return keys.length;
    } catch (error) {
      logger.error('Cache invalidate by tag error', { tag, error });
      return 0;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const redis = getRedisClient();
      const result = await redis.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Cache exists error', { key, error });
      return false;
    }
  }

  async ttl(key: string): Promise<number> {
    if (!this.enabled) return -1;

    try {
      const redis = getRedisClient();
      return await redis.ttl(key);
    } catch (error) {
      logger.error('Cache ttl error', { key, error });
      return -1;
    }
  }

  async clear(): Promise<boolean> {
    if (!this.enabled) return false;

    try {
      const redis = getRedisClient();
      await redis.flushdb();
      logger.info('Cache cleared');
      return true;
    } catch (error) {
      logger.error('Cache clear error', { error });
      return false;
    }
  }

  private async addToTags(key: string, tags: string[]): Promise<void> {
    try {
      const redis = getRedisClient();
      const pipeline = redis.pipeline();

      for (const tag of tags) {
        const tagKey = `tag:${tag}`;
        pipeline.sadd(tagKey, key);
      }

      await pipeline.exec();
    } catch (error) {
      logger.error('Cache add to tags error', { key, tags, error });
    }
  }

  async wrap<T>(
    key: string,
    fetcher: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key);
    
    if (cached !== null) {
      return cached;
    }

    const fresh = await fetcher();
    await this.set(key, fresh, options);
    
    return fresh;
  }
}

export const cacheManager = new CacheManager();
