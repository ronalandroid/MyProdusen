import { prisma } from '@/lib/db';

export class ShiftService {
  async createShift(data: {
    name: string;
    startTime: string;
    endTime: string;
  }) {
    const shift = await prisma.shift.create({
      data: {
        name: data.name,
        startTime: data.startTime,
        endTime: data.endTime,
      },
    });

    return shift;
  }

  async getShifts(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    const shifts = await prisma.shift.findMany({
      where,
      orderBy: {
        startTime: 'asc',
      },
    });

    return shifts;
  }

  async getShiftById(id: string) {
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employees: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
      },
    });

    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    return shift;
  }

  async updateShift(
    id: string,
    data: {
      name?: string;
      startTime?: string;
      endTime?: string;
      isActive?: boolean;
    }
  ) {
    const shift = await prisma.shift.findUnique({
      where: { id },
    });

    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    const updated = await prisma.shift.update({
      where: { id },
      data,
    });

    return updated;
  }

  async deleteShift(id: string) {
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        employees: true,
        attendances: true,
      },
    });

    if (!shift) {
      throw new Error('Shift tidak ditemukan');
    }

    // Check if shift is being used
    if (shift.employees.length > 0) {
      throw new Error('Shift masih digunakan oleh karyawan');
    }

    if (shift.attendances.length > 0) {
      // Soft delete by deactivating
      await prisma.shift.update({
        where: { id },
        data: { isActive: false },
      });

      return { message: 'Shift berhasil dinonaktifkan' };
    }

    // Hard delete if no historical data
    await prisma.shift.delete({
      where: { id },
    });

    return { message: 'Shift berhasil dihapus' };
  }
}

export const shiftService = new ShiftService();
