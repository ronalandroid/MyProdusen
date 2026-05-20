import { describe, it, expect, afterEach, vi } from 'vitest';
import { POST as loginPOST } from '@/app/api/auth/login/route';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { GET as profileGET } from '@/app/api/auth/profile/route';
import { POST as changePasswordPOST } from '@/app/api/auth/change-password/route';
import { createTestUser, createMockRequest, cleanupTestData } from '../helpers/test-utils';
import { hashPassword } from '@/lib/auth';
import { db, users } from '@/lib/db';
import { eq } from 'drizzle-orm';

describe('Auth API', () => {
  const testUserIds: string[] = [];

  afterEach(async () => {
    vi.unstubAllEnvs();
    await cleanupTestData({ userIds: testUserIds });
    testUserIds.length = 0;
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      // Create test user with known password
      const hashedPassword = await hashPassword('Testpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;
      
      await db.insert(users).values({
        id: userId,
        email: 'login@test.com',
        username: 'loginuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      });
      testUserIds.push(userId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', {
        body: {
          email: 'login@test.com',
          password: 'Testpassword123!',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.user.email).toBe('login@test.com');
    });

    it('should expose TestSprite-compatible login aliases only when configured', async () => {
      vi.stubEnv('TESTSPRITE_COMPAT_RESPONSE', 'true');
      const hashedPassword = await hashPassword('Testpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;

      await db.insert(users).values({
        id: userId,
        email: 'login-compat@test.com',
        username: 'logincompatuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      });
      testUserIds.push(userId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', {
        body: {
          email: 'login-compat@test.com',
          password: 'Testpassword123!',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.user.email).toBe('login-compat@test.com');
      expect(data.email).toBe('login-compat@test.com');
      expect(data.role).toBe('EMPLOYEE');
      expect(data.active).toBe(true);
    });

    it('should fail with invalid email', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', {
        body: {
          email: 'nonexistent@test.com',
          password: 'Testpassword123!',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Email atau password salah');
    });

    it('should fail with invalid password', async () => {
      const hashedPassword = await hashPassword('Correctpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;
      
      await db.insert(users).values({
        id: userId,
        email: 'wrongpass@test.com',
        username: 'wrongpassuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      });
      testUserIds.push(userId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', {
        body: {
          email: 'wrongpass@test.com',
          password: 'Wrongpassword123!',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should fail with inactive user', async () => {
      const hashedPassword = await hashPassword('Testpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;
      
      await db.insert(users).values({
        id: userId,
        email: 'inactive@test.com',
        username: 'inactiveuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: false,
      });
      testUserIds.push(userId);

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', {
        body: {
          email: 'inactive@test.com',
          password: 'Testpassword123!',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.message).toContain('tidak aktif');
    });

    it('should fail with missing fields', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/login', {
        body: {
          email: 'test@test.com',
        },
      });

      const response = await loginPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user as SUPERADMIN', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);
      const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const email = `newuser_${uniqueSuffix}@test.com`;
      const username = `newuser_${uniqueSuffix}`;

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        token: superadmin.token,
        body: {
          email,
          username,
          password: 'Password123!',
          role: 'EMPLOYEE',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(email);
      
      // Cleanup
      if (data.data.id) {
        testUserIds.push(data.data.id);
      }
    });

    it('should fail when ADMIN_HR tries to create SUPERADMIN', async () => {
      const adminHr = await createTestUser('ADMIN_HR');
      testUserIds.push(adminHr.id);

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        token: adminHr.token,
        body: {
          email: 'newsuperadmin@test.com',
          username: 'newsuperadmin',
          password: 'Password123!',
          role: 'SUPERADMIN',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
    });

    it('should fail without authentication', async () => {
      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        body: {
          email: 'newuser@test.com',
          username: 'newuser',
          password: 'Password123!',
          role: 'EMPLOYEE',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should fail with duplicate email', async () => {
      const superadmin = await createTestUser('SUPERADMIN');
      testUserIds.push(superadmin.id);

      const existingUser = await createTestUser('EMPLOYEE', {
        email: 'existing@test.com',
      });
      testUserIds.push(existingUser.id);

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/register', {
        token: superadmin.token,
        body: {
          email: 'existing@test.com',
          username: 'newusername',
          password: 'Password123!',
          role: 'EMPLOYEE',
        },
      });

      const response = await registerPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.message).toContain('Email sudah terdaftar');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/profile', {
        token: user.token,
      });

      const response = await profileGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(user.email);
    });

    it('should expose TestSprite-compatible profile aliases only when configured', async () => {
      vi.stubEnv('TESTSPRITE_COMPAT_RESPONSE', 'true');
      const user = await createTestUser('EMPLOYEE');
      testUserIds.push(user.id);

      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/profile', {
        token: user.token,
      });

      const response = await profileGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.email).toBe(user.email);
      expect(data.email).toBe(user.email);
      expect(data.active).toBe(true);
    });

    it('should fail without token', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/profile');

      const response = await profileGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });

    it('should fail with invalid token', async () => {
      const request = createMockRequest('GET', 'http://localhost:3000/api/auth/profile', {
        token: 'invalid.token.here',
      });

      const response = await profileGET(request as any);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await hashPassword('Oldpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;
      
      const [user] = await db.insert(users).values({
        id: userId,
        email: 'changepass@test.com',
        username: 'changepassuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      }).returning();
      testUserIds.push(userId);

      const testUser = await createTestUser('EMPLOYEE', { id: userId });

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/change-password', {
        token: testUser.token,
        body: {
          currentPassword: 'Oldpassword123!',
          newPassword: 'Newpassword123!',
          confirmPassword: 'Newpassword123!',
        },
      });

      const response = await changePasswordPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept TestSprite oldPassword alias only when configured', async () => {
      vi.stubEnv('TESTSPRITE_COMPAT_RESPONSE', 'true');
      const hashedPassword = await hashPassword('Oldpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;

      await db.insert(users).values({
        id: userId,
        email: 'changepass-compat@test.com',
        username: 'changepasscompatuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      });
      testUserIds.push(userId);

      const testUser = await createTestUser('EMPLOYEE', { id: userId });

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/change-password', {
        token: testUser.token,
        body: {
          oldPassword: 'Oldpassword123!',
          newPassword: 'Newpassword123!',
        },
      });

      const response = await changePasswordPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should fail with wrong current password', async () => {
      const hashedPassword = await hashPassword('Correctpassword123!');
      const timestamp = Date.now();
      const userId = `test_user_${timestamp}`;
      
      await db.insert(users).values({
        id: userId,
        email: 'wrongcurrent@test.com',
        username: 'wrongcurrentuser',
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      });
      testUserIds.push(userId);

      const testUser = await createTestUser('EMPLOYEE', { id: userId });

      const request = createMockRequest('POST', 'http://localhost:3000/api/auth/change-password', {
        token: testUser.token,
        body: {
          currentPassword: 'Wrongpassword123!',
          newPassword: 'Newpassword123!',
          confirmPassword: 'Newpassword123!',
        },
      });

      const response = await changePasswordPOST(request as any);
      const data = await response.json();

      expect(response.status).toBe(422);
      expect(data.success).toBe(false);
    });
  });
});
