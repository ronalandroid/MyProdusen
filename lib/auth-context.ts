import { cookies } from 'next/headers';
import { verifyToken, type JwtPayload, type UserRole } from './auth';
import { db } from './db';
import { users, employees } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

export interface CurrentUser extends JwtPayload {
  id: string;
  employeeId?: string;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('myprodusen_token')?.value;

    if (!token) {
      return null;
    }

    const payload = verifyToken(token);
    if (!payload) {
      return null;
    }

    // Verify user is still active
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, payload.userId))
      .limit(1);

    if (!user || !user.isActive) {
      return null;
    }

    // Get employee ID if exists
    const [employee] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, user.id))
      .limit(1);

    return {
      id: user.id,
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
      employeeId: employee?.id,
    };
  } catch (error) {
    console.error('Get current user error:', error);
    return null;
  }
}

export async function requireAuth(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}

export async function requireRole(
  allowedRoles: UserRole[]
): Promise<CurrentUser> {
  const user = await requireAuth();
  if (!allowedRoles.includes(user.role)) {
    throw new Error('Forbidden');
  }
  return user;
}
