import { getRedisClient, isRedisConfigured } from '@/lib/cache/redis';
import { logger } from '@/lib/logger';

export type JobName = 'report.export' | 'email.send' | 'notification.fanout' | 'payroll.calculate';

export interface JobPayload<T = unknown> {
  id: string;
  name: JobName;
  payload: T;
  createdAt: string;
}

const JOB_QUEUE_KEY = 'myprodusen:jobs:default';

export function createJob<T>(name: JobName, payload: T): JobPayload<T> {
  return {
    id: `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    name,
    payload,
    createdAt: new Date().toISOString(),
  };
}

export async function enqueueJob<T>(name: JobName, payload: T): Promise<JobPayload<T>> {
  const job = createJob(name, payload);

  if (!isRedisConfigured()) {
    logger.warn('Job queue unavailable; job recorded for inline fallback', { jobId: job.id, name });
    return job;
  }

  try {
    const redis = getRedisClient();
    await redis.lpush(JOB_QUEUE_KEY, JSON.stringify(job));
    return job;
  } catch (error) {
    logger.warn('Job enqueue failed; caller may use inline fallback', {
      jobId: job.id,
      name,
      error: error instanceof Error ? error.message : 'Unknown Redis error',
    });
    return job;
  }
}
