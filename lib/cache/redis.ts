import Redis, { RedisOptions } from 'ioredis';
import { logger } from '../logger';

let redisClient: Redis | null = null;

const REDIS_URL = process.env.REDIS_URL || '';
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;
const REDIS_DB = parseInt(process.env.REDIS_DB || '0', 10);
const REDIS_MAX_RETRIES = parseInt(process.env.REDIS_MAX_RETRIES || '3', 10);

export function isRedisConfigured(): boolean {
  return REDIS_URL.length > 0;
}

const redisOptions: RedisOptions = {
  maxRetriesPerRequest: REDIS_MAX_RETRIES,
  enableReadyCheck: true,
  enableOfflineQueue: true,
  connectTimeout: 10000,
  retryStrategy(times: number) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err: Error) {
    const targetError = 'READONLY';
    if (err.message.includes(targetError)) {
      return true;
    }
    return false;
  },
};

export function getRedisClient(): Redis {
  if (!isRedisConfigured()) {
    throw new Error('REDIS_URL is not configured');
  }

  if (redisClient) {
    return redisClient;
  }

  try {
    redisClient = new Redis(REDIS_URL, {
      ...redisOptions,
      password: REDIS_PASSWORD,
      db: REDIS_DB,
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected');
    });

    redisClient.on('ready', () => {
      logger.info('Redis client ready');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis client error', { error: err.message });
    });

    redisClient.on('close', () => {
      logger.warn('Redis client connection closed');
    });

    redisClient.on('reconnecting', () => {
      logger.info('Redis client reconnecting');
    });

    return redisClient;
  } catch (error) {
    logger.error('Failed to create Redis client', { error });
    throw error;
  }
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    logger.info('Redis client closed');
  }
}

export async function pingRedis(): Promise<boolean> {
  try {
    const client = getRedisClient();
    const result = await client.ping();
    return result === 'PONG';
  } catch (error) {
    logger.error('Redis ping failed', { error });
    return false;
  }
}
