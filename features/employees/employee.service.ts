import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getNextNIP } from '@/lib/utils/nip-generator';
import { EmployeeStatus, UserRole } from '@prisma/client';
import { CreateEmployeeInput, UpdateEmployeeInput } from '@/lib/validations/employee';

export class EmployeeService {
  async createEmployee(data: CreateEmployeeInput) {
    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingEmail) {
      throw new Error('Email sudah terdaftar');
    }

    // Check if username already exists
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });

    if (existingUsername) {
      throw new Error('Username sudah terdaftar');
    }

    // Generate NIP
    const joinDate = typeof data.joinDate === 'string' ? new Date(data.joinDate) : data.joinDate;
    const existingNIPs = await prisma.employee.findMany({
      select: { nip: true },
    });
    const nip = await getNextNIP(joinDate, existingNIPs.map(e => e.nip));

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Create user and employee in transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: data.email,
          username: data.username,
          password: hashedPassword,
          role: data.role,
        },
      });

      const employee = await tx.employee.create({
        data: {
          nip,
          userId: user.id,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          joinDate,
          division: data.division,
          position: data.position,
          supervisorId: data.supervisorId,
          defaultShiftId: data.defaultShiftId,
          defaultLocationId: data.defaultLocationId,
          emergencyContact: data.emergencyContact,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
            },
          },
          supervisor: true,
          defaultShift: true,
          defaultLocation: true,
        },
      });

      return employee;
    });

    return result;
  }

  async getEmployees(filters?: {
    status?: EmployeeStatus;
    division?: string;
    supervisorId?: string;
    search?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.division) {
      where.division = filters.division;
    }

    if (filters?.supervisorId) {
      where.supervisorId = filters.supervisorId;
    }

    if (filters?.search) {
      where.OR = [
        { fullName: { contains: filters.search, mode: 'insensitive' } },
        { nip: { contains: filters.search, mode: 'insensitive' } },
        { email: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const employees = await prisma.employee.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        defaultShift: true,
        defaultLocation: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return employees;
  }

  async getEmployeeById(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
          },
        },
        supervisor: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        subordinates: {
          select: {
            id: true,
            fullName: true,
            nip: true,
          },
        },
        defaultShift: true,
        defaultLocation: true,
      },
    });

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    return employee;
  }

  async updateEmployee(id: string, data: UpdateEmployeeInput) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    // Check if email is being changed and already exists
    if (data.email && data.email !== employee.email) {
      const existingEmail = await prisma.user.findFirst({
        where: {
          email: data.email,
          id: { not: employee.userId },
        },
      });

      if (existingEmail) {
        throw new Error('Email sudah terdaftar');
      }
    }

    // Update employee and user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user email if changed
      if (data.email && data.email !== employee.email) {
        await tx.user.update({
          where: { id: employee.userId },
          data: { email: data.email },
        });
      }

      // Update employee
      const updated = await tx.employee.update({
        where: { id },
        data: {
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          address: data.address,
          division: data.division,
          position: data.position,
          supervisorId: data.supervisorId,
          defaultShiftId: data.defaultShiftId,
          defaultLocationId: data.defaultLocationId,
          emergencyContact: data.emergencyContact,
          status: data.status,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              role: true,
              isActive: true,
            },
          },
          supervisor: true,
          defaultShift: true,
          defaultLocation: true,
        },
      });

      return updated;
    });

    return result;
  }

  async deactivateEmployee(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    // Deactivate employee and user
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { status: EmployeeStatus.INACTIVE },
      });

      await tx.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });
    });

    return { message: 'Karyawan berhasil dinonaktifkan' };
  }

  async activateEmployee(id: string) {
    const employee = await prisma.employee.findUnique({
      where: { id },
    });

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    // Activate employee and user
    await prisma.$transaction(async (tx) => {
      await tx.employee.update({
        where: { id },
        data: { status: EmployeeStatus.ACTIVE },
      });

      await tx.user.update({
        where: { id: employee.userId },
        data: { isActive: true },
      });
    });

    return { message: 'Karyawan berhasil diaktifkan' };
  }

  async getEmployeeByUserId(userId: string) {
    const employee = await prisma.employee.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
          },
        },
        supervisor: true,
        defaultShift: true,
        defaultLocation: true,
      },
    });

    if (!employee) {
      throw new Error('Data karyawan tidak ditemukan');
    }

    return employee;
  }
}

export const employeeService = new EmployeeService();
