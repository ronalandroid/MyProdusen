import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { BaseService } from '@/lib/core/base-service';
import { AppError } from '@/lib/core/app-error';
import { shiftRepository, ShiftRepository } from '@/server/repositories/shifts.repository';

export class ShiftService extends BaseService {
  constructor(private readonly repository: ShiftRepository = shiftRepository) {
    super();
  }

  async createShift(data: {
    name: string;
    startTime: string;
    endTime: string;
  }) {
    const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const shift = await this.repository.create({
      id: shiftId,
      name: data.name,
      startTime: data.startTime,
      endTime: data.endTime,
      isActive: true,
    });

    await this.invalidateShiftCaches();

    return shift;
  }

  async getShifts(filters?: { isActive?: boolean }) {
    const cacheKey = filters?.isActive ? CacheKeys.shifts.active() : CacheKeys.shifts.list();

    return cacheManager.wrap(
      cacheKey,
      () => this.repository.list(filters),
      {
        ttl: CacheStrategy.shiftList,
        tags: [CacheTags.shifts],
      },
    );
  }

  async getShiftById(id: string) {
    const cacheKey = CacheKeys.shifts.detail(id);

    return cacheManager.wrap(
      cacheKey,
      async () => {
        const shift = await this.repository.findById(id);

        if (!shift) {
          throw AppError.notFound('Shift tidak ditemukan');
        }

        return shift;
      },
      {
        ttl: CacheStrategy.shiftDetail,
        tags: [CacheTags.shifts],
      },
    );
  }

  async updateShift(id: string, data: Partial<{
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>) {
    const shift = await this.repository.findById(id);

    if (!shift) {
      throw AppError.notFound('Shift tidak ditemukan');
    }

    const updated = await this.repository.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw AppError.notFound('Shift tidak ditemukan');
    }

    await this.invalidateShiftCaches(id);

    return updated;
  }

  async deleteShift(id: string) {
    const shift = await this.repository.findById(id);

    if (!shift) {
      throw AppError.notFound('Shift tidak ditemukan');
    }

    await this.repository.delete(id);
    await this.invalidateShiftCaches(id);

    return { message: 'Shift berhasil dihapus' };
  }

  private async invalidateShiftCaches(shiftId?: string): Promise<void> {
    await cacheManager.invalidateByTag(CacheTags.shifts);

    if (shiftId) {
      await cacheManager.delete(CacheKeys.shifts.detail(shiftId));
    }

    await cacheManager.delete(CacheKeys.shifts.active());
    await cacheManager.delete(CacheKeys.shifts.list());
  }
}

export const shiftService = new ShiftService();
