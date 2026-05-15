import { db, workLocations } from '@/lib/db';
import { eq } from 'drizzle-orm';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';

export class WorkLocationService {
  async createWorkLocation(data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  }) {
    const locationId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [location] = await db
      .insert(workLocations)
      .values({
        id: locationId,
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius || 100,
        isActive: true,
      })
      .returning();

    // Invalidate work location caches
    await this.invalidateWorkLocationCaches();

    return location;
  }

  async getWorkLocations(filters?: { isActive?: boolean }) {
    const cacheKey = filters?.isActive 
      ? CacheKeys.workLocations.active() 
      : CacheKeys.workLocations.list();

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        let query = db.select().from(workLocations);

        if (filters?.isActive !== undefined) {
          query = query.where(eq(workLocations.isActive, filters.isActive)) as any;
        }

        return await query;
      },
      {
        ttl: CacheStrategy.workLocationList,
        tags: [CacheTags.workLocations],
      }
    );
  }

  async getWorkLocationById(id: string) {
    const cacheKey = CacheKeys.workLocations.detail(id);

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        const [location] = await db
          .select()
          .from(workLocations)
          .where(eq(workLocations.id, id))
          .limit(1);

        if (!location) {
          throw new Error('Lokasi kerja tidak ditemukan');
        }

        return location;
      },
      {
        ttl: CacheStrategy.workLocationDetail,
        tags: [CacheTags.workLocations],
      }
    );
  }

  async updateWorkLocation(id: string, data: Partial<{
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius: number;
    isActive: boolean;
  }>) {
    const [location] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, id))
      .limit(1);

    if (!location) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    const [updated] = await db
      .update(workLocations)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(workLocations.id, id))
      .returning();

    // Invalidate work location caches
    await this.invalidateWorkLocationCaches(id);

    return updated;
  }

  async deleteWorkLocation(id: string) {
    const [location] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, id))
      .limit(1);

    if (!location) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    await db
      .delete(workLocations)
      .where(eq(workLocations.id, id));

    // Invalidate work location caches
    await this.invalidateWorkLocationCaches(id);

    return { message: 'Lokasi kerja berhasil dihapus' };
  }

  private async invalidateWorkLocationCaches(locationId?: string): Promise<void> {
    await cacheManager.invalidateByTag(CacheTags.workLocations);
    
    if (locationId) {
      await cacheManager.delete(CacheKeys.workLocations.detail(locationId));
    }
    
    await cacheManager.delete(CacheKeys.workLocations.active());
    await cacheManager.delete(CacheKeys.workLocations.list());
  }
}

export const workLocationService = new WorkLocationService();
