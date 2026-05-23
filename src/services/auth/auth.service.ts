import { db, users, employees } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken, getProductionJwtSecret } from '@/lib/auth';
import { validatePassword } from '@/lib/password-policy';
import { eq, or, asc, and, sql } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { BaseService } from '@/lib/core/base-service';
import { AppError } from '@/lib/core/app-error';

export type UserRole = 'SUPERADMIN' | 'LEADER' | 'EMPLOYEE';

export function toProductionUserRole(role: string): UserRole {
  if (role === 'SUPERADMIN' || role === 'LEADER' || role === 'EMPLOYEE') return role;
  return 'EMPLOYEE';
}

export class AuthService extends BaseService {
  async login(email: string, password: string) {
    const identifier = email.trim();
    const [user] = await db
      .select()
      .from(users)
      .where(or(eq(users.email, identifier), eq(users.username, identifier)))
      .limit(1);

    if (!user) {
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'Email atau password salah', 401);
    }

    if (!user.isActive) {
      throw new AppError('AUTH_USER_INACTIVE', 'Akun tidak aktif. Cek inbox email aktivasi atau hubungi Superadmin.', 403);
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new AppError('AUTH_INVALID_CREDENTIALS', 'Email atau password salah', 401);
    }

    // Get employee data if exists
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, user.id))
      .limit(1);

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role as UserRole,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        employee: employee || null,
      },
    };
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    role: UserRole;
    isActive?: boolean;
  }) {
    // Validate password policy
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors[0]);
    }

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

    const hashedPassword = await hashPassword(data.password);

    // Generate unique ID (using timestamp + random)
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const [user] = await db
      .insert(users)
      .values({
        id: userId,
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role,
        isActive: data.isActive ?? true,
      })
      .returning();

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
    };
  }

  async listUsers() {
    const rows = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        employeeId: employees.id,
        fullName: employees.fullName,
        phone: employees.phone,
        address: employees.address,
        division: employees.division,
        position: employees.position,
        profileCompletedAt: employees.profileCompletedAt,
        defaultLocationId: employees.defaultLocationId,
        defaultShiftId: employees.defaultShiftId,
        teamId: sql<string | null>`(
          select eta."teamId"
          from "EmployeeTeamAssignment" eta
          where eta."employeeId" = "Employee"."id" and eta.active = true
          order by eta."updatedAt" desc
          limit 1
        )`,
      })
      .from(users)
      .leftJoin(employees, eq(employees.userId, users.id))
      .orderBy(asc(users.username));

    return rows.map(row => ({
      id: row.id,
      email: row.email,
      username: row.username,
      role: toProductionUserRole(row.role),
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      hasEmployeeProfile: !!row.employeeId,
      employeeId: row.employeeId,
      fullName: row.fullName,
      phone: row.phone,
      address: row.address,
      division: row.division,
      position: row.position,
      profileCompletedAt: row.profileCompletedAt,
      defaultLocationId: row.defaultLocationId,
      defaultShiftId: row.defaultShiftId,
      teamId: row.teamId,
    }));
  }

  async countActiveSuperadmins(excludeUserId?: string) {
    const [row] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(users)
      .where(excludeUserId ? and(eq(users.role, 'SUPERADMIN'), eq(users.isActive, true), sql`${users.id} <> ${excludeUserId}`) : and(eq(users.role, 'SUPERADMIN'), eq(users.isActive, true)));
    return Number(row?.count || 0);
  }

  async getUserSummary(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw AppError.notFound('User tidak ditemukan');
    }

    return { ...user, role: toProductionUserRole(user.role) };
  }

  async updateUserRole(userId: string, role: UserRole, isActive?: boolean) {
    const [user] = await db
      .update(users)
      .set({ role, ...(typeof isActive === 'boolean' ? { isActive } : {}), updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
      });

    if (!user) {
      throw AppError.notFound('User tidak ditemukan');
    }

    return user;
  }

  async createPasswordResetToken(email: string) {
    const [user] = await db
      .select({ id: users.id, email: users.email, isActive: users.isActive })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user || !user.isActive) {
      return null;
    }

    const secret = getProductionJwtSecret();
    return jwt.sign({ userId: user.id, email: user.email, purpose: 'password-reset' }, secret, { expiresIn: '30m' });
  }

  async createAccountActivationToken(identifier: string) {
    const normalizedIdentifier = identifier.trim();
    const [user] = await db
      .select({ id: users.id, email: users.email, isActive: users.isActive })
      .from(users)
      .where(or(eq(users.email, normalizedIdentifier), eq(users.username, normalizedIdentifier)))
      .limit(1);

    if (!user || user.isActive) {
      return null;
    }

    const secret = getProductionJwtSecret();
    const token = jwt.sign({ userId: user.id, email: user.email, purpose: 'account-activation' }, secret, { expiresIn: '24h' });
    return { token, email: user.email };
  }

  async activateAccount(token: string) {
    const secret = getProductionJwtSecret();
    const payload = jwt.verify(token, secret) as { userId: string; email: string; purpose?: string };

    if (payload.purpose !== 'account-activation') {
      throw new Error('Token aktivasi akun tidak valid');
    }

    const [user] = await db
      .update(users)
      .set({ isActive: true, updatedAt: new Date() })
      .where(eq(users.id, payload.userId))
      .returning({ id: users.id, email: users.email, username: users.username, role: users.role, isActive: users.isActive });

    if (!user) {
      throw AppError.notFound('User tidak ditemukan');
    }

    return { success: true, userId: user.id, email: user.email, username: user.username, role: user.role, isActive: user.isActive };
  }

  async resetPassword(token: string, password: string) {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors[0]);
    }

    const secret = getProductionJwtSecret();
    const payload = jwt.verify(token, secret) as { userId: string; email: string; purpose?: string };

    if (payload.purpose !== 'password-reset') {
      throw new Error('Token reset password tidak valid');
    }

    const hashedPassword = await hashPassword(password);
    await db
      .update(users)
      .set({ password: hashedPassword, updatedAt: new Date() })
      .where(eq(users.id, payload.userId));

    return { success: true, userId: payload.userId, email: payload.email };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Validate new password policy
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw AppError.validation(passwordValidation.errors[0]);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw AppError.notFound('User tidak ditemukan');
    }

    const isPasswordValid = await verifyPassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw AppError.validation('Password lama salah');
    }

    const hashedPassword = await hashPassword(newPassword);

    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));

    return { success: true };
  }

  async getProfile(userId: string) {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        username: users.username,
        role: users.role,
        isActive: users.isActive,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw AppError.notFound('User tidak ditemukan');
    }

    // Get employee data if exists
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.userId, user.id))
      .limit(1);

    return {
      ...user,
      employee: employee || null,
    };
  }
}

export const authService = new AuthService();
