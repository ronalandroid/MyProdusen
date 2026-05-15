import { logger } from '../logger';

interface CacheMetrics {
  hits: number;
  misses: number;
  sets: number;
  deletes: number;
  errors: number;
}

class CacheMetricsCollector {
  private metrics: CacheMetrics = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
    errors: 0,
  };

  private startTime: number = Date.now();

  recordHit(): void {
    this.metrics.hits++;
  }

  recordMiss(): void {
    this.metrics.misses++;
  }

  recordSet(): void {
    this.metrics.sets++;
  }

  recordDelete(): void {
    this.metrics.deletes++;
  }

  recordError(): void {
    this.metrics.errors++;
  }

  getMetrics() {
    const total = this.metrics.hits + this.metrics.misses;
    const hitRate = total > 0 ? (this.metrics.hits / total) * 100 : 0;
    const uptime = Math.floor((Date.now() - this.startTime) / 1000);

    return {
      ...this.metrics,
      total,
      hitRate: hitRate.toFixed(2) + '%',
      uptime: `${uptime}s`,
    };
  }

  reset(): void {
    this.metrics = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      errors: 0,
    };
    this.startTime = Date.now();
    logger.info('Cache metrics reset');
  }

  logMetrics(): void {
    const metrics = this.getMetrics();
    logger.info('Cache metrics', metrics);
  }
}

export const cacheMetrics = new CacheMetricsCollector();

// Log metrics every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cacheMetrics.logMetrics();
  }, 5 * 60 * 1000);
}
