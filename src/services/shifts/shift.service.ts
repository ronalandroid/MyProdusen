import { db, shifts } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';

export class ShiftService {
  async createShift(data: {
    name: string;
    startTime: string;
    endTime: string;
  }) {
    const shiftId = `shift_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [shift] = await db
      .insert(shifts)
      .values({
        id: shiftId,
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
        isActive: true,
      })
      .returning();

    // Invalidate shift caches
    await this.invalidateShiftCaches();

    return shift;
  }

  async getShifts(filters?: { isActive?: boolean }) {
    const cacheKey = filters?.isActive 
      ? CacheKeys.shifts.active() 
      : CacheKeys.shifts.list();

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        let query = db.select().from(shifts);

        if (filters?.isActive !== undefined) {
          query = query.where(eq(shifts.isActive, filters.isActive)) as any;
        }

        return await query;
      },
      {
        ttl: CacheStrategy.shiftList,
        tags: [CacheTags.shifts],
      }
    );
  }

  async getShiftById(id: string) {
    const cacheKey = CacheKeys.shifts.detail(id);

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        const [shift] = await db
          .select()
          .from(shifts)
          .where(eq(shifts.id, id))
          .limit(1);

        if (!shift) {
          throw new Error('Shift tidak ditemukan');
        }

        return shift;
      },
      {
        ttl: CacheStrategy.shiftDetail,
        tags: [CacheTags.shifts],
      }
    );
  }

  async updateShift(id: string, data: Partial<{
    name: string;
    startTime: string;
    endTime: string;
    isActive: boolean;
  }>) {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    const [updated] = await db
      .update(shifts)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(shifts.id, id))
      .returning();

    // Invalidate shift caches
    await this.invalidateShiftCaches(id);

    return updated;
  }

  async deleteShift(id: string) {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    await db
      .delete(shifts)
      .where(eq(shifts.id, id));

    // Invalidate shift caches
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
