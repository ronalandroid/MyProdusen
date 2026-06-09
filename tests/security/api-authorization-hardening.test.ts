import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = process.cwd();
const read = (p: string) => readFileSync(join(root, p), 'utf8');

/**
 * Regression guards for the security hardening pass (OWASP API Top 10).
 * These are source-contract assertions: they fail loudly if a future edit
 * reintroduces a BOLA hole or unwires the global CSRF middleware.
 */
describe('attendance/payroll API authorization hardening', () => {
  it('reimbursement claims GET hard-scopes non-SUPERADMIN to their own employee', () => {
    const src = read('app/api/reimbursement/claims/route.ts');
    // Only SUPERADMIN may pass through ?employeeId; others are forced to self.
    expect(src).toMatch(/user\.role === 'SUPERADMIN'/);
    expect(src).toMatch(/filters\.employeeId = user\.employeeId/);
    // The old broad "any non-EMPLOYEE reads anything" branch must be gone.
    expect(src).not.toMatch(/else if \(searchParams\.get\('employeeId'\)\)/);
  });

  it('overtime requests GET hard-scopes non-SUPERADMIN to their own employee', () => {
    const src = read('app/api/overtime/requests/route.ts');
    expect(src).toMatch(/user\.role === 'SUPERADMIN'/);
    expect(src).toMatch(/filters\.employeeId = user\.employeeId/);
    expect(src).not.toMatch(/else if \(searchParams\.get\('employeeId'\)\)/);
    // Internal error messages must not leak to the client.
    expect(src).not.toMatch(/errorResponse\(error\.message/);
  });

  it('KPI result-by-id GET enforces ownership for non-KPI_READ roles', () => {
    const src = read('app/api/kpi/results/[id]/route.ts');
    expect(src).toMatch(/getResultById/);
    expect(src).toMatch(/hasPermission\(user\.role, 'KPI_READ'\)/);
    expect(src).toMatch(/result\.employee\?\.userId/);
    expect(src).toMatch(/forbiddenResponse/);
  });
});

describe('global edge proxy is active for Next 16', () => {
  it('proxy.ts exports the global CSRF/auth edge entrypoint and API matcher', () => {
    const src = read('proxy.ts');
    expect(src).toMatch(/export function proxy/);
    expect(src).toMatch(/'\/api\/:path\*'/);
    expect(src).toMatch(/isTrustedMutationOrigin/);
  });
});

describe('test-only activation-token endpoint is production-hardened', () => {
  it('blocks in production regardless of compat env flag', () => {
    const src = read('app/api/auth/test-get-activation-token/route.ts');
    expect(src).toMatch(/process\.env\.NODE_ENV === 'production'/);
    expect(src).toMatch(/assertTestCompatEnabled/);
  });

  it('keeps legacy public-register-token compat endpoint gated, validated, and rate limited', () => {
    const src = read('app/api/auth/public-register-token/route.ts');
    expect(src).toMatch(/process\.env\.NODE_ENV === 'production'/);
    expect(src).toMatch(/TESTSPRITE_COMPAT_RESPONSE !== 'true'/);
    expect(src).toMatch(/z\.string\(\)\.email/);
    expect(src).toMatch(/rateLimit\(request, RATE_LIMITS\.REGISTRATION, 'public-register-token'\)/);
  });
});

describe('auth rate limiting fails safe, not open', () => {
  it('LOGIN/REGISTER/PASSWORD_CHANGE configs are marked failSafe', () => {
    const src = read('lib/rate-limit/index.ts');
    expect(src).toMatch(/LOGIN:[\s\S]*?failSafe: true/);
    expect(src).toMatch(/REGISTER:[\s\S]*?failSafe: true/);
    expect(src).toMatch(/PASSWORD_CHANGE:[\s\S]*?failSafe: true/);
    expect(src).toMatch(/memoryCheck/);
  });
});

describe('baseline HTTP security headers are configured', () => {
  it('next.config.js sets CSP, frame, referrer, and permissions headers', () => {
    const src = read('next.config.js');
    expect(src).toMatch(/Content-Security-Policy/);
    expect(src).toMatch(/X-Frame-Options/);
    expect(src).toMatch(/Referrer-Policy/);
    expect(src).toMatch(/Permissions-Policy/);
    expect(src).toMatch(/Strict-Transport-Security/);
    expect(src).toMatch(/frame-ancestors 'none'/);
  });
});

describe('ECC route hardening: abuse rate limits', () => {
  it('rate limits password change and attendance clock endpoints', () => {
    expect(read('app/api/auth/change-password/route.ts')).toMatch(/RATE_LIMITS\.API_STRICT/);
    expect(read('app/api/attendance/check-in/route.ts')).toMatch(/RATE_LIMITS\.ATTENDANCE/);
    expect(read('app/api/attendance/check-out/route.ts')).toMatch(/RATE_LIMITS\.ATTENDANCE/);
  });
});

describe('duplicate API auth aliases are removed', () => {
  it('does not expose /api/api/auth alias routes', () => {
    expect(() => read('app/api/api/auth/login/route.ts')).toThrow();
    expect(() => read('app/api/api/auth/public-register/route.ts')).toThrow();
  });
});

describe('ECC performance/settings route hardening', () => {
  it('scrubs gamification errors and rate limits mutating handlers', () => {
    const src = read('lib/gamification/api.ts');
    expect(src).toMatch(/RATE_LIMITS\.API_STRICT/);
    expect(src).toMatch(/enforceStrictMutationLimit\(request, 'settings:gamification'\)/);
    expect(src).toMatch(/enforceStrictMutationLimit\(request, 'settings:theme'\)/);
    expect(src).toMatch(/enforceStrictMutationLimit\(request, 'performance:culture-score'\)/);
    expect(src).not.toMatch(/errorResponse\(error\.message \|\| 'Gagal memproses performance'/);
    expect(src).toMatch(/errorResponse\('Gagal memproses performance', 500\)/);
  });
});
