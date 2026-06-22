import { cacheManager } from './cache-manager';
import { CacheKeys } from './cache-keys';
import { CacheStrategy } from './cache-strategies';
import { logger } from '../logger';
import { workLocationService } from '@/features/work-locations/work-location.service';
import { shiftService } from '@/services/shifts/shift.service';

export class CacheWarmer {
  private isWarming = false;

  async warmCriticalCaches(): Promise<void> {
    if (this.isWarming) {
      logger.warn('Cache warming already in progress');
      return;
    }

    this.isWarming = true;
    const startTime = Date.now();

    try {
      logger.info('Starting cache warming');

      await Promise.all([
        this.warmWorkLocations(),
        this.warmShifts(),
      ]);

      const duration = Date.now() - startTime;
      logger.info('Cache warming completed', { duration: `${duration}ms` });
    } catch (error) {
      logger.error('Cache warming failed', { error });
    } finally {
      this.isWarming = false;
    }
  }

  private async warmWorkLocations(): Promise<void> {
    try {
      const activeLocations = await workLocationService.getWorkLocations({ isActive: true });
      logger.info('Warmed work locations cache', { count: activeLocations.length });
    } catch (error) {
      logger.error('Failed to warm work locations cache', { error });
    }
  }

  private async warmShifts(): Promise<void> {
    try {
      const activeShifts = await shiftService.getShifts({ isActive: true });
      logger.info('Warmed shifts cache', { count: activeShifts.length });
    } catch (error) {
      logger.error('Failed to warm shifts cache', { error });
    }
  }

  async schedulePeriodicWarming(intervalMs: number = 5 * 60 * 1000): Promise<void> {
    logger.info('Scheduling periodic cache warming', { interval: `${intervalMs}ms` });

    setInterval(async () => {
      await this.warmCriticalCaches();
    }, intervalMs);
  }
}

export const cacheWarmer = new CacheWarmer();

// Warm cache on startup if in production
if (process.env.NODE_ENV === 'production') {
  setTimeout(() => {
    cacheWarmer.warmCriticalCaches().catch((error) => {
      logger.error('Initial cache warming failed', { error });
    });
  }, 5000);
}
