import { db, employees, users, shifts, workLocations } from '@/lib/db';
import { eq, and, or, ilike, sql, asc } from 'drizzle-orm';
import type { PaginationParams } from '@/lib/api/pagination';
import { paginated } from '@/lib/api/pagination';
import { getNextNIP } from '@/utils/nip-generator';
import { hashPassword } from '@/lib/auth';
import { cacheManager } from '@/lib/cache/cache-manager';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';
import { CacheStrategy } from '@/lib/cache/cache-strategies';
import { BaseService } from '@/lib/core/base-service';
import { AppError } from '@/lib/core/app-error';

export type EmployeeStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export class EmployeeService extends BaseService {
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
    joinDate?: Date | string;
  }) {
    // Check if email already exists
    const [existingEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (existingEmail) {
      throw new AppError('VALIDATION_ERROR', 'Email sudah terdaftar', 400);
    }

    // Check if username already exists
    const [existingUsername] = await db
      .select()
      .from(users)
      .where(eq(users.username, data.username))
      .limit(1);

    if (existingUsername) {
      throw new AppError('VALIDATION_ERROR', 'Username sudah terdaftar', 400);
    }

    // Get all existing NIPs
    const allEmployees = await db.select({ nip: employees.nip }).from(employees);
    const existingNIPs = allEmployees.map(e => e.nip);

    // Generate NIP
    const joinDate = data.joinDate ? new Date(data.joinDate) : new Date();
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

    // Invalidate employee caches
    await this.invalidateEmployeeCaches();

    return employee;
  }

  async getEmployees(filters?: {
    search?: string;
    status?: EmployeeStatus;
    division?: string;
    supervisorId?: string;
  }) {
    const cacheKey = CacheKeys.employees.list(
      filters?.status,
      filters?.supervisorId
    );

    // Only cache simple list queries without search
    if (!filters?.search && !filters?.division) {
      return await cacheManager.wrap(
        cacheKey,
        async () => {
          return await this.fetchEmployees(filters);
        },
        {
          ttl: CacheStrategy.employeeList,
          tags: [CacheTags.employees],
        }
      );
    }

    return await this.fetchEmployees(filters);
  }

  async getEmployeesPaginated(filters: {
    search?: string;
    status?: EmployeeStatus;
    division?: string;
    supervisorId?: string;
  }, pagination: PaginationParams) {
    const conditions = this.buildEmployeeConditions(filters);
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [totalResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(employees)
      .where(whereClause);

    const rows = await db
      .select({
        id: employees.id,
        nip: employees.nip,
        userId: employees.userId,
        fullName: employees.fullName,
        email: employees.email,
        phone: employees.phone,
        division: employees.division,
        position: employees.position,
        supervisorId: employees.supervisorId,
        status: employees.status,
        defaultShiftId: employees.defaultShiftId,
        defaultLocationId: employees.defaultLocationId,
        joinDate: employees.joinDate,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .where(whereClause)
      .orderBy(asc(employees.fullName))
      .limit(pagination.limit)
      .offset(pagination.offset);

    return paginated(rows, totalResult?.count || 0, pagination);
  }

  private async fetchEmployees(filters?: {
    search?: string;
    status?: EmployeeStatus;
    division?: string;
    supervisorId?: string;
  }) {
    let query = db.select().from(employees);

    const conditions = this.buildEmployeeConditions(filters);

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    return await query;
  }

  private buildEmployeeConditions(filters?: {
    search?: string;
    status?: EmployeeStatus;
    division?: string;
    supervisorId?: string;
  }) {
    const conditions = [];

    if (filters?.search) {
      conditions.push(
        or(
          ilike(employees.fullName, `%${filters.search}%`),
          ilike(employees.nip, `%${filters.search}%`),
          ilike(employees.email, `%${filters.search}%`)
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

    return conditions;
  }

  async getEmployeeById(id: string) {
    const cacheKey = CacheKeys.employees.detail(id);

    return await cacheManager.wrap(
      cacheKey,
      async () => {
        const [employee] = await db
          .select()
          .from(employees)
          .where(eq(employees.id, id))
          .limit(1);

        if (!employee) {
          throw AppError.notFound('Karyawan tidak ditemukan');
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
      },
      {
        ttl: CacheStrategy.employeeDetail,
        tags: [CacheTags.employees],
      }
    );
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
      throw AppError.notFound('Karyawan tidak ditemukan');
    }

    const [updated] = await db
      .update(employees)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(employees.id, id))
      .returning();

    // Invalidate caches
    await this.invalidateEmployeeCaches(id);

    return updated;
  }

  async deleteEmployee(id: string) {
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.id, id))
      .limit(1);

    if (!employee) {
      throw AppError.notFound('Karyawan tidak ditemukan');
    }

    // Delete employee (will cascade to user due to FK)
    await db
      .delete(employees)
      .where(eq(employees.id, id));

    // Delete associated user
    await db
      .delete(users)
      .where(eq(users.id, employee.userId));

    // Invalidate caches
    await this.invalidateEmployeeCaches(id);

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

  private async invalidateEmployeeCaches(employeeId?: string): Promise<void> {
    await cacheManager.invalidateByTag(CacheTags.employees);
    
    if (employeeId) {
      await cacheManager.delete(CacheKeys.employees.detail(employeeId));
    }
    
    await cacheManager.delete(CacheKeys.employees.count());
    await cacheManager.deletePattern('employees:list:*');
  }
}

export const employeeService = new EmployeeService();
