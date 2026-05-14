import { db, workLocations } from '@/lib/db';
import { eq } from 'drizzle-orm';

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

    return location;
  }

  async getWorkLocations(filters?: { isActive?: boolean }) {
    let query = db.select().from(workLocations);

    if (filters?.isActive !== undefined) {
      query = query.where(eq(workLocations.isActive, filters.isActive)) as any;
    }

    return await query;
  }

  async getWorkLocationById(id: string) {
    const [location] = await db
      .select()
      .from(workLocations)
      .where(eq(workLocations.id, id))
      .limit(1);

    if (!location) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    return location;
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

    return { message: 'Lokasi kerja berhasil dihapus' };
  }
}

export const workLocationService = new WorkLocationService();
