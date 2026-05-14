import { prisma } from '@/lib/db';
import { hashPassword, verifyPassword, generateToken } from '@/lib/auth';
import { UserRole } from '@prisma/client';

export class AuthService {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        employee: true,
      },
    });

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

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        employee: user.employee,
      },
    };
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    role: UserRole;
  }) {
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

    const hashedPassword = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        role: data.role,
      },
    });

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
    };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    if (!user.isActive) {
      throw new Error('Akun tidak aktif');
    }

    const isPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isPasswordValid) {
      throw new Error('Password lama salah');
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password berhasil diubah' };
  }

  async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: {
          include: {
            supervisor: true,
            defaultShift: true,
            defaultLocation: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error('User tidak ditemukan');
    }

    if (!user.isActive) {
      throw new Error('Akun tidak aktif');
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      isActive: user.isActive,
      employee: user.employee,
    };
  }
}

export const authService = new AuthService();
