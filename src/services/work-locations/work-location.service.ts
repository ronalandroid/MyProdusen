import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { BaseService } from '@/lib/core/base-service';
import { AppError } from '@/lib/core/app-error';
import { workLocationRepository, WorkLocationRepository } from '@/server/repositories/work-locations.repository';

export class WorkLocationService extends BaseService {
  constructor(private readonly repository: WorkLocationRepository = workLocationRepository) {
    super();
  }

  async createWorkLocation(data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  }) {
    const locationId = `loc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const location = await this.repository.create({
      id: locationId,
      name: data.name,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      radius: data.radius || 100,
      isActive: true,
    });

    await this.invalidateWorkLocationCaches();

    return location;
  }

  async getWorkLocations(filters?: { isActive?: boolean; search?: string }) {
    if (filters?.search) {
      // Skip cache for search queries — small variance space, low cache value.
      return this.repository.list(filters);
    }
    const cacheKey = filters?.isActive ? CacheKeys.workLocations.active() : CacheKeys.workLocations.list();

    return cacheManager.wrap(
      cacheKey,
      () => this.repository.list(filters),
      {
        ttl: CacheStrategy.workLocationList,
        tags: [CacheTags.workLocations],
      },
    );
  }

  async getWorkLocationById(id: string) {
    const cacheKey = CacheKeys.workLocations.detail(id);

    return cacheManager.wrap(
      cacheKey,
      async () => {
        const location = await this.repository.findById(id);

        if (!location) {
          throw AppError.notFound('Lokasi kerja tidak ditemukan');
        }

        return location;
      },
      {
        ttl: CacheStrategy.workLocationDetail,
        tags: [CacheTags.workLocations],
      },
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
    const location = await this.repository.findById(id);

    if (!location) {
      throw AppError.notFound('Lokasi kerja tidak ditemukan');
    }

    const updated = await this.repository.update(id, {
      ...data,
      updatedAt: new Date(),
    });

    if (!updated) {
      throw AppError.notFound('Lokasi kerja tidak ditemukan');
    }

    await this.invalidateWorkLocationCaches(id);

    return updated;
  }

  async deleteWorkLocation(id: string) {
    const location = await this.repository.findById(id);

    if (!location) {
      throw AppError.notFound('Lokasi kerja tidak ditemukan');
    }

    await this.repository.delete(id);
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
