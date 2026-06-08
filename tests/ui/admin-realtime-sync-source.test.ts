import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const usersPage = readFileSync('app/dashboard/users/page.tsx', 'utf8');
const dashboardLayout = readFileSync('app/dashboard/layout.tsx', 'utf8');

describe('superadmin realtime assignment sync source contract', () => {
  it('guards users page refreshes from stale older responses', () => {
    // React Query keyed cache supersedes the old manual loadSeq guard: only the
    // latest ["users"] query result is rendered, and refreshes invalidate that key.
    expect(usersPage).toContain('useQuery');
    expect(usersPage).toContain('queryKey: ["users"]');
    expect(usersPage).toContain('invalidateQueries({ queryKey: ["users"] })');
  });

  it('refreshes profile state and route access when work data changes', () => {
    expect(dashboardLayout).toContain('Data pekerjaan Anda telah diperbarui.');
    expect(dashboardLayout).toContain('JSON.stringify(current) !== JSON.stringify(nextProfileMe)');
    expect(dashboardLayout).toContain('canAccessNavigationPath(sessionProfile.role as UserRole, pathname)');
    expect(dashboardLayout).toContain('router.replace("/dashboard")');
  });
});
