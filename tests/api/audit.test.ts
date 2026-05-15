import { describe, expect, it, vi } from 'vitest';

const { logMock } = vi.hoisted(() => ({ logMock: vi.fn() }));
vi.mock('@/features/audit/audit.service', () => ({
  auditService: { log: logMock },
}));

import { logAudit } from '@/lib/audit';

describe('logAudit', () => {
  it('redacts password fields before writing audit values', async () => {
    await logAudit('user-1', 'CREATE', 'User', 'created-user', undefined, {
      email: 'safe@example.com',
      password: 'secret',
      nested: { newPassword: 'new-secret' },
    });

    expect(logMock).toHaveBeenCalledWith(expect.objectContaining({
      newValue: JSON.stringify({
        email: 'safe@example.com',
        password: '[REDACTED]',
        nested: { newPassword: '[REDACTED]' },
      }),
    }));
  });
});
