import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const usersPage = readFileSync('app/dashboard/users/page.tsx', 'utf8');
const dashboardLayout = readFileSync('app/dashboard/layout.tsx', 'utf8');

describe('superadmin realtime assignment sync source contract', () => {
  it('guards users page refreshes from stale older responses', () => {
    expect(usersPage).toContain('useRef');
    expect(usersPage).toContain('loadSeq');
    expect(usersPage).toContain('seq !== loadSeq.current');
    expect(usersPage).toContain('if (seq === loadSeq.current) setLoading(false)');
  });

  it('refreshes profile state and route access when work data changes', () => {
    expect(dashboardLayout).toContain('Data pekerjaan Anda telah diperbarui.');
    expect(dashboardLayout).toContain('JSON.stringify(current) !== JSON.stringify(nextProfileMe)');
    expect(dashboardLayout).toContain('canAccessNavigationPath(sessionProfile.role as UserRole, pathname)');
    expect(dashboardLayout).toContain('router.replace("/dashboard")');
  });
});
