import { db, shifts } from '@/lib/db';
import { eq } from 'drizzle-orm';

export type ShiftRecord = typeof shifts.$inferSelect;
export type CreateShiftInput = Pick<typeof shifts.$inferInsert, 'id' | 'name' | 'startTime' | 'endTime' | 'isActive'>;
export type UpdateShiftInput = Partial<Pick<typeof shifts.$inferInsert, 'name' | 'startTime' | 'endTime' | 'isActive' | 'updatedAt'>>;

export class ShiftRepository {
  async create(data: CreateShiftInput) {
    const [shift] = await db.insert(shifts).values(data).returning();
    return shift;
  }

  async list(filters?: { isActive?: boolean }) {
    if (filters?.isActive === undefined) {
      return db.select().from(shifts);
    }

    return db.select().from(shifts).where(eq(shifts.isActive, filters.isActive));
  }

  async findById(id: string) {
    const [shift] = await db.select().from(shifts).where(eq(shifts.id, id)).limit(1);
    return shift || null;
  }

  async update(id: string, data: UpdateShiftInput) {
    const [shift] = await db.update(shifts).set(data).where(eq(shifts.id, id)).returning();
    return shift || null;
  }

  async delete(id: string) {
    await db.delete(shifts).where(eq(shifts.id, id));
  }
}

export const shiftRepository = new ShiftRepository();
