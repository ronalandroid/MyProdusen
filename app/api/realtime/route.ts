import { NextRequest } from 'next/server';
import Redis from 'ioredis';
import { requireAuth } from '@/lib/middleware';
import { isRedisConfigured } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';
import { canReceiveRealtimeEvent, REALTIME_CHANNEL, RealtimeEvent } from '@/lib/realtime/events';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEARTBEAT_MS = 25_000;

function createSseMessage(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

function createRedisSubscriber() {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return null;

  return new Redis(redisUrl, {
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
    connectTimeout: 5000,
    lazyConnect: true,
  });
}

export async function GET(request: NextRequest) {
  let user;

  try {
    user = await requireAuth(request);
  } catch (_error) {
    return new Response('Unauthorized', { status: 401 });
  }

  const encoder = new TextEncoder();
  let subscriber: Redis | null = null;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(encoder.encode(createSseMessage(event, data)));
      };

      send('connected', {
        status: 'ok',
        transport: 'sse',
        redis: isRedisConfigured() ? 'enabled' : 'disabled',
      });

      heartbeat = setInterval(() => {
        send('heartbeat', { status: 'ok', timestamp: new Date().toISOString() });
      }, HEARTBEAT_MS);

      if (!isRedisConfigured()) {
        return;
      }

      try {
        subscriber = createRedisSubscriber();
        if (!subscriber) return;

        await subscriber.connect();
        await subscriber.subscribe(REALTIME_CHANNEL);

        subscriber.on('message', (_channel, message) => {
          try {
            const event = JSON.parse(message) as RealtimeEvent;
            if (canReceiveRealtimeEvent(event, user)) {
              send(event.type, event);
            }
          } catch (_error) {
            logger.warn('Invalid realtime event received');
          }
        });
      } catch (error) {
        logger.warn('Realtime Redis subscriber unavailable; SSE heartbeat remains active', {
          error: error instanceof Error ? error.message : 'Unknown Redis error',
        });
        await subscriber?.quit().catch(() => undefined);
        subscriber = null;
      }
    },
    async cancel() {
      if (heartbeat) clearInterval(heartbeat);
      await subscriber?.quit().catch(() => undefined);
    },
  });

  request.signal.addEventListener('abort', async () => {
    if (heartbeat) clearInterval(heartbeat);
    await subscriber?.quit().catch(() => undefined);
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
