import { db, users, employees } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { validatePassword } from '@/lib/password-policy';
import { eq } from 'drizzle-orm';

export type UserRole = 'SUPERADMIN' | 'ADMIN_HR' | 'SUPERVISOR' | 'EMPLOYEE';

export class AuthService {
  async login(email: string, password: string) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (!user) {
      throw new Error('Email atau password salah');
    }

    if (!user.isActive) {
      throw new Error('Akun tidak aktif');
    }

    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Email atau password salah');
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
      })
      .returning();

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    // Validate new password policy
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(passwordValidation.errors[0]);
    }

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    const isPasswordValid = await verifyPassword(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Password lama salah');
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
      throw new Error('User tidak ditemukan');
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
