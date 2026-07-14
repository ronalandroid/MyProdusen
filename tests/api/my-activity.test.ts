import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { inArray } from 'drizzle-orm';
import { db, auditLogs } from '@/lib/db';
import { GET as myActivityGET } from '@/app/api/me/activity/route';
import { humanizeAuditAction } from '@/lib/audit/humanize';
import { createMockRequest, createTestUser, cleanupTestData, type TestUser } from '../helpers/test-utils';

let alice: TestUser;
let bob: TestUser;
const auditIds: string[] = [];

async function seedLog(userId: string, action: string, entity: string) {
  const id = `test_audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  await db.insert(auditLogs).values({ id, userId, action, entity, entityId: userId });
  auditIds.push(id);
  return id;
}

beforeAll(async () => {
  alice = await createTestUser('EMPLOYEE');
  bob = await createTestUser('EMPLOYEE');
  await seedLog(alice.id, 'CHECK_IN', 'Attendance');
  await seedLog(alice.id, 'CHANGE_PASSWORD', 'User');
  await seedLog(bob.id, 'CHECK_IN', 'Attendance');
});

afterAll(async () => {
  if (auditIds.length) await db.delete(auditLogs).where(inArray(auditLogs.id, auditIds));
  await cleanupTestData({ userIds: [alice.id, bob.id] });
});

describe('humanizeAuditAction', () => {
  it('maps known actions to friendly Indonesian labels', () => {
    expect(humanizeAuditAction('CHECK_IN')).toBe('Absen masuk');
    expect(humanizeAuditAction('CHANGE_PASSWORD')).toBe('Mengubah kata sandi');
  });

  it('appends entity for generic verbs', () => {
    expect(humanizeAuditAction('UPDATE', 'LeaveRequest')).toBe('Memperbarui data cuti');
  });

  it('title-cases unknown actions instead of leaking the raw code', () => {
    expect(humanizeAuditAction('SOME_NEW_ACTION')).toBe('Some New Action');
  });
});

describe('GET /api/me/activity', () => {
  it('requires authentication', async () => {
    const res = await myActivityGET(createMockRequest('GET', 'http://localhost:3000/api/me/activity') as any);
    expect(res.status).toBe(401);
  });

  it('returns only the caller own logs, never another user activity', async () => {
    const res = await myActivityGET(
      createMockRequest('GET', 'http://localhost:3000/api/me/activity', { token: alice.token }) as any,
    );
    const payload = await res.json();
    expect(payload.success).toBe(true);
    expect(payload.data.length).toBeGreaterThanOrEqual(2);
    // Every returned entry carries a friendly label and none belong to Bob.
    for (const item of payload.data) {
      expect(item.label).toBeTruthy();
      expect(item.entityId ?? alice.id).not.toBe(bob.id);
    }
    expect(payload.data.some((i: { label: string }) => i.label === 'Absen masuk')).toBe(true);
  });

  it('ignores a userId query param (cannot be used to view another user)', async () => {
    const res = await myActivityGET(
      createMockRequest('GET', `http://localhost:3000/api/me/activity?userId=${bob.id}`, { token: alice.token }) as any,
    );
    const payload = await res.json();
    // Still scoped to Alice — Bob's single log must not appear (Alice has 2, Bob 1).
    expect(payload.data.length).toBe(2);
  });
});
