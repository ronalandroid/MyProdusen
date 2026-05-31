import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const setup = readFileSync('scripts/setup-uat-leader-flow.mjs', 'utf8');
const verify = readFileSync('scripts/verify-uat-leader-flow.mjs', 'utf8');
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));

describe('UAT auth credential scripts', () => {
  it('setup updates password hashes for existing UAT users without printing passwords', () => {
    expect(setup).toContain('bcrypt.hash(input.password');
    expect(setup).toMatch(/update "User"[\s\S]*password = \$\{passwordHash\}/);
    expect(setup).toContain('verifyPassword');
    expect(setup).toContain('Password hashes refreshed');
    expect(setup).not.toMatch(/console\.log\([^)]*(process\.env|input\.password|plainText)/i);
  });

  it('verify script checks password readiness for leader and employees', () => {
    expect(verify).toContain('bcrypt.compare');
    expect(verify).toContain('UAT_LEADER_PASSWORD');
    expect(verify).toContain('UAT_EMPLOYEE_A_PASSWORD');
    expect(verify).toContain('UAT_EMPLOYEE_B_PASSWORD');
    expect(verify).toContain('leader_login_ready');
    expect(verify).toContain('employee_a_login_ready');
    expect(verify).toContain('employee_b_login_ready');
  });

  it('package exposes a verify:uat-auth alias', () => {
    expect(pkg.scripts['verify:uat-auth']).toBe('node scripts/verify-uat-leader-flow.mjs');
  });
});
