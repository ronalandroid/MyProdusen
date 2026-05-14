import { db, shifts } from '@/lib/db';
import { eq } from 'drizzle-orm';

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

    return shift;
  }

  async getShifts(filters?: { isActive?: boolean }) {
    let query = db.select().from(shifts);

    if (filters?.isActive !== undefined) {
      query = query.where(eq(shifts.isActive, filters.isActive)) as any;
    }

    return await query;
  }

  async getShiftById(id: string) {
    const [shift] = await db
      .select()
      .from(shifts)
      .where(eq(shifts.id, id))
      .limit(1);

    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    return shift;
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

    return { message: 'Shift berhasil dihapus' };
  }
}

export const shiftService = new ShiftService();
