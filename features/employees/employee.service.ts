import { db, employees, users, shifts, workLocations } from '@/lib/db';
import { eq, and, or, like, sql } from 'drizzle-orm';
import { getNextNIP } from '@/lib/utils/nip-generator';
import { hashPassword } from '@/lib/auth';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export class EmployeeService {
  async createEmployee(data: {
    email: string;
    username: string;
    password: string;
    fullName: string;
    phone?: string;
    address?: string;
    division?: string;
    position?: string;
    supervisorId?: string;
    defaultShiftId?: string;
    defaultLocationId?: string;
    joinDate?: Date;
  }) {
    // Check if email already exists
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingEmail) {
      throw new Error('Email sudah terdaftar');
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    if (existingUsername) {
      throw new Error('Username sudah terdaftar');
    }

    // Get all existing NIPs
    const allEmployees = await db.select({ nip: employees.nip }).from(employees);
    const existingNIPs = allEmployees.map(e => e.nip);

    // Generate NIP
    const joinDate = data.joinDate || new Date();
    const nip = await getNextNIP(joinDate, existingNIPs);

    // Hash password
    const hashedPassword = await hashPassword(data.password);

    // Generate IDs
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const employeeId = `emp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create user
    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: 'EMPLOYEE',
      })
      .returning();

    // Create employee
    const [employee] = await db
      .insert(employees)
      .values({
        id: employeeId,
        nip,
        userId: user.id,
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        division: data.division,
        position: data.position,
        supervisorId: data.supervisorId,
        defaultShiftId: data.defaultShiftId,
        defaultLocationId: data.defaultLocationId,
        joinDate: joinDate,
        status: 'ACTIVE',
      })
      .returning();

    return employee;
  }

  async getEmployees(filters?: {
    search?: string;
    status?: EmployeeStatus;
    division?: string;
    supervisorId?: string;
  }) {
    let query = db.select().from(employees);

    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          like(employees.fullName, `%${filters.search}%`),
          like(employees.nip, `%${filters.search}%`),
          like(employees.email, `%${filters.search}%`)
        )
      );
    }

    if (filters?.status) {
      conditions.push(eq(employees.status, filters.status));
    }

    if (filters?.division) {
      conditions.push(eq(employees.division, filters.division));
    }

    if (filters?.supervisorId) {
      conditions.push(eq(employees.supervisorId, filters.supervisorId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  async getEmployeeById(id: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    // Get related data
    let supervisor = null;
    if (employee.supervisorId) {
      const [sup] = await db
        .select()
        .from(employees)
        .where(eq(employees.id, employee.supervisorId))
        .limit(1);
      supervisor = sup || null;
    }

    let defaultShift = null;
    if (employee.defaultShiftId) {
      const [shift] = await db
        .select()
        .from(shifts)
        .where(eq(shifts.id, employee.defaultShiftId))
        .limit(1);
      defaultShift = shift || null;
    }

    let defaultLocation = null;
    if (employee.defaultLocationId) {
      const [location] = await db
        .select()
        .from(workLocations)
        .where(eq(workLocations.id, employee.defaultLocationId))
        .limit(1);
      defaultLocation = location || null;
    }

    return {
      ...employee,
      supervisor,
      defaultShift,
      defaultLocation,
    };
  }

  async updateEmployee(id: string, data: Partial<{
    fullName: string;
    phone: string;
    address: string;
    division: string;
    position: string;
    supervisorId: string;
    status: EmployeeStatus;
    defaultShiftId: string;
    defaultLocationId: string;
    profilePhoto: string;
    emergencyContact: string;
  }>) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    const [updated] = await db
      .update(employees)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();

    return updated;
  }

  async deleteEmployee(id: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      throw new Error('Karyawan tidak ditemukan');
    }

    // Delete employee (will cascade to user due to FK)
    await db
      .delete(employees)
      .where(eq(employees.id, id));

    // Delete associated user
    await db
      .delete(users)
      .where(eq(users.id, employee.userId));

    return { message: 'Karyawan berhasil dihapus' };
  }

  async getEmployeeByUserId(userId: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, userId))
      .limit(1);

    return employee || null;
  }
}

export const employeeService = new EmployeeService();
