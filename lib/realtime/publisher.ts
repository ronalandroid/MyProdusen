import { getRedisClient, isRedisConfigured } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import { REALTIME_CHANNEL, RealtimeEvent, createRealtimeEvent } from './events';

export async function publishRealtimeEvent(event: RealtimeEvent): Promise<boolean> {
  if (!isRedisConfigured()) {
    logger.debug('Realtime event skipped; Redis not configured', { type: event.type, scope: event.scope });
    return false;
  }

  try {
    const redis = getRedisClient();
    await redis.publish(REALTIME_CHANNEL, JSON.stringify(event));
    return true;
  } catch (error) {
    logger.warn('Realtime publish failed; continuing without push', {
      type: event.type,
      scope: event.scope,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    });
    return false;
  }
}

export { createRealtimeEvent };
