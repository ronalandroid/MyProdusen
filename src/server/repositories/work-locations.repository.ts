import { db, workLocations } from '@/lib/db';
import { eq } from 'drizzle-orm';

export type WorkLocationRecord = typeof workLocations.$inferSelect;
export type CreateWorkLocationInput = Pick<typeof workLocations.$inferInsert, 'id' | 'name' | 'address' | 'latitude' | 'longitude' | 'radius' | 'isActive'>;
export type UpdateWorkLocationInput = Partial<Pick<typeof workLocations.$inferInsert, 'name' | 'address' | 'latitude' | 'longitude' | 'radius' | 'isActive' | 'updatedAt'>>;

export class WorkLocationRepository {
  async create(data: CreateWorkLocationInput) {
    const [location] = await db.insert(workLocations).values(data).returning();
    return location;
  }

  async list(filters?: { isActive?: boolean }) {
    if (filters?.isActive === undefined) {
      return db.select().from(workLocations);
    }

    return db.select().from(workLocations).where(eq(workLocations.isActive, filters.isActive));
  }

  async findById(id: string) {
    const [location] = await db.select().from(workLocations).where(eq(workLocations.id, id)).limit(1);
    return location || null;
  }

  async update(id: string, data: UpdateWorkLocationInput) {
    const [location] = await db.update(workLocations).set(data).where(eq(workLocations.id, id)).returning();
    return location || null;
  }

  async delete(id: string) {
    await db.delete(workLocations).where(eq(workLocations.id, id));
  }
}

export const workLocationRepository = new WorkLocationRepository();
