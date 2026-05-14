import { prisma } from '@/lib/db';

export class WorkLocationService {
  async createWorkLocation(data: {
    name: string;
    address: string;
    latitude: number;
    longitude: number;
    radius?: number;
  }) {
    const workLocation = await prisma.workLocation.create({
      data: {
        name: data.name,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius || 100,
      },
    });

    return workLocation;
  }

  async getWorkLocations(includeInactive: boolean = false) {
    const where = includeInactive ? {} : { isActive: true };

    const workLocations = await prisma.workLocation.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return workLocations;
  }

  async getWorkLocationById(id: string) {
    const workLocation = await prisma.workLocation.findUnique({
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

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    return workLocation;
  }

  async updateWorkLocation(
    id: string,
    data: {
      name?: string;
      address?: string;
      latitude?: number;
      longitude?: number;
      radius?: number;
      isActive?: boolean;
    }
  ) {
    const workLocation = await prisma.workLocation.findUnique({
      where: { id },
    });

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    const updated = await prisma.workLocation.update({
      where: { id },
      data,
    });

    return updated;
  }

  async deleteWorkLocation(id: string) {
    const workLocation = await prisma.workLocation.findUnique({
      where: { id },
      include: {
        employees: true,
        attendances: true,
      },
    });

    if (!workLocation) {
      throw new Error('Lokasi kerja tidak ditemukan');
    }

    // Check if location is being used
    if (workLocation.employees.length > 0) {
      throw new Error('Lokasi kerja masih digunakan oleh karyawan');
    }

    if (workLocation.attendances.length > 0) {
      // Soft delete by deactivating
      await prisma.workLocation.update({
        where: { id },
        data: { isActive: false },
      });

      return { message: 'Lokasi kerja berhasil dinonaktifkan' };
    }

    // Hard delete if no historical data
    await prisma.workLocation.delete({
      where: { id },
    });

    return { message: 'Lokasi kerja berhasil dihapus' };
  }
}

export const workLocationService = new WorkLocationService();
