import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('production blocker guards', () => {
  it('does not ship default user creation password in dashboard UI', () => {
    const source = readFileSync('app/dashboard/users/page.tsx', 'utf8');
    expect(source).not.toContain('defaultValue="Password123!"');
    expect(source).not.toContain('formData.get("password") || "Password123!"');
  });

  it('does not fallback to default employee password in API payload normalization', () => {
    const source = readFileSync('app/api/employees/route.ts', 'utf8');
    expect(source).not.toContain("body?.password ?? 'Password123!'");
  });

  it('does not return mock sync success responses for queue operations', () => {
    const source = readFileSync('app/api/sync/queue/route.ts', 'utf8');
    expect(source).not.toContain('mock response');
    expect(source).not.toContain('att_${Date.now()}');
    expect(source).not.toContain('leave_${Date.now()}');
  });
});
