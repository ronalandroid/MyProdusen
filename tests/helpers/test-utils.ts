import { generateToken, JwtPayload } from '@/lib/auth';
import { db, users, employees, workLocations, shifts } from '@/lib/db';
import { eq } from 'drizzle-orm';

export interface TestUser {
  id: string;
  email: string;
  username: string;
  role: 'SUPERADMIN' | 'ADMIN_HR' | 'SUPERVISOR' | 'EMPLOYEE';
  token: string;
  employeeId?: string;
}

export async function createTestUser(
  role: 'SUPERADMIN' | 'ADMIN_HR' | 'SUPERVISOR' | 'EMPLOYEE' = 'EMPLOYEE',
  overrides?: Partial<TestUser>
): Promise<TestUser> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  const userId = overrides?.id || `test_user_${timestamp}_${random}`;
  const email = overrides?.email || `test_${timestamp}_${random}@test.com`;
  const username = overrides?.username || `test_${timestamp}_${random}`;

  if (overrides?.id) {
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, overrides.id))
      .limit(1);

    if (existingUser) {
      const token = generateToken({
        userId: existingUser.id,
        email: existingUser.email,
        role: existingUser.role as any,
      });

      return {
        id: existingUser.id,
        email: existingUser.email,
        username: existingUser.username,
        role: existingUser.role as any,
        token,
      };
    }
  }

  const [user] = await db
    .insert(users)
    .values({
      id: userId,
      email,
      username,
      password: 'hashed_password_not_used_in_tests',
      role,
      isActive: true,
    })
    .returning();

  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role as any,
  });

  return {
    id: user.id,
    email: user.email,
    username: user.username,
    role: user.role as any,
    token,
  };
}

export async function createTestEmployee(
  userId: string,
  overrides?: {
    supervisorId?: string;
    defaultShiftId?: string;
    defaultLocationId?: string;
    status?: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  }
): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  const employeeId = `test_emp_${timestamp}_${random}`;
  const nip = `NIP${timestamp}${random.toUpperCase()}`;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [employee] = await db
    .insert(employees)
    .values({
      id: employeeId,
      nip,
      userId,
      fullName: `Test Employee ${random}`,
      email: user.email,
      phone: '081234567890',
      address: 'Test Address',
      division: 'Test Division',
      position: 'Test Position',
      supervisorId: overrides?.supervisorId,
      defaultShiftId: overrides?.defaultShiftId,
      defaultLocationId: overrides?.defaultLocationId,
      status: overrides?.status || 'ACTIVE',
      joinDate: new Date(),
    })
    .returning();

  return employee.id;
}

export async function createTestWorkLocation(overrides?: {
  name?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  isActive?: boolean;
}): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  const locationId = `test_loc_${timestamp}_${random}`;

  const [location] = await db
    .insert(workLocations)
    .values({
      id: locationId,
      name: overrides?.name || `Test Location ${random}`,
      address: 'Test Address',
      latitude: overrides?.latitude ?? 3.5952,
      longitude: overrides?.longitude ?? 98.6722,
      radius: overrides?.radius ?? 100,
      isActive: overrides?.isActive ?? true,
    })
    .returning();

  return location.id;
}

export async function createTestShift(overrides?: {
  name?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
}): Promise<string> {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  
  const shiftId = `test_shift_${timestamp}_${random}`;

  const [shift] = await db
    .insert(shifts)
    .values({
      id: shiftId,
      name: overrides?.name || `Test Shift ${random}`,
      startTime: overrides?.startTime || '08:00',
      endTime: overrides?.endTime || '17:00',
      isActive: overrides?.isActive ?? true,
    })
    .returning();

  return shift.id;
}

export async function cleanupTestData(ids: {
  userIds?: string[];
  employeeIds?: string[];
  locationIds?: string[];
  shiftIds?: string[];
}) {
  // Clean up in reverse order of dependencies
  if (ids.employeeIds?.length) {
    for (const id of ids.employeeIds) {
      await db.delete(employees).where(eq(employees.id, id));
    }
  }

  if (ids.userIds?.length) {
    for (const id of ids.userIds) {
      await db.delete(users).where(eq(users.id, id));
    }
  }

  if (ids.locationIds?.length) {
    for (const id of ids.locationIds) {
      await db.delete(workLocations).where(eq(workLocations.id, id));
    }
  }

  if (ids.shiftIds?.length) {
    for (const id of ids.shiftIds) {
      await db.delete(shifts).where(eq(shifts.id, id));
    }
  }
}

export function createMockRequest(
  method: string,
  url: string,
  options?: {
    body?: any;
    headers?: Record<string, string>;
    token?: string;
  }
): Request {
  const headers = new Headers(options?.headers || {});
  
  if (options?.token) {
    headers.set('authorization', `Bearer ${options.token}`);
  }

  if (options?.body) {
    headers.set('content-type', 'application/json');
  }

  return new Request(url, {
    method,
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  }) as any;
}
