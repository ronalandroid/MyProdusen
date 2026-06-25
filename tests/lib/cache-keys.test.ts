import { describe, it, expect } from 'vitest';
import { CacheKeys, CacheTags } from '@/lib/cache/cache-keys';

/**
 * Unit tests for the pure cache-key builders — exercise both branches of the
 * optional-argument keys so the conditional `parts.push(...)` paths are covered.
 */
describe('CacheKeys builders', () => {
  it('employees: covers the optional role/team branches', () => {
    expect(typeof CacheKeys.employees.list()).toBe('string');
    expect(CacheKeys.employees.list('LEADER', 'team1')).toContain('team1');
    expect(CacheKeys.employees.detail('e1')).toContain('e1');
    expect(typeof CacheKeys.employees.count()).toBe('string');
    expect(CacheKeys.employees.byTeam('t1')).toContain('t1');
  });

  it('attendance: covers today/list/summary/stats', () => {
    expect(typeof CacheKeys.attendance.today()).toBe('string');
    expect(typeof CacheKeys.attendance.today('e1')).toBe('string');
    expect(typeof CacheKeys.attendance.list()).toBe('string');
    expect(CacheKeys.attendance.list('2099-01-01', 'e1')).toContain('e1');
    expect(CacheKeys.attendance.summary('e1', '2099-01')).toContain('e1');
    expect(CacheKeys.attendance.stats('2099-01-01')).toContain('2099-01-01');
  });

  it('workLocations + shifts: active/detail/list', () => {
    expect(typeof CacheKeys.workLocations.active()).toBe('string');
    expect(CacheKeys.workLocations.detail('l1')).toContain('l1');
    expect(typeof CacheKeys.workLocations.list()).toBe('string');
    expect(typeof CacheKeys.shifts.active()).toBe('string');
    expect(CacheKeys.shifts.detail('s1')).toContain('s1');
    expect(typeof CacheKeys.shifts.list()).toBe('string');
  });

  it('leave + dashboard + rateLimit', () => {
    expect(CacheKeys.leave.pending('sup1')).toContain('sup1');
    expect(typeof CacheKeys.leave.list()).toBe('string');
    expect(CacheKeys.leave.list('e1', 'PENDING')).toContain('e1');
    expect(CacheKeys.leave.detail('lv1')).toContain('lv1');
    expect(typeof CacheKeys.dashboard.stats()).toBe('string');
    expect(CacheKeys.dashboard.stats('2099-01-01')).toContain('2099-01-01');
    expect(CacheKeys.dashboard.charts('monthly')).toContain('monthly');
    expect(typeof CacheKeys.dashboard.summary()).toBe('string');
    expect(CacheKeys.rateLimit.key('ip1', '/login')).toContain('ip1');
  });

  it('CacheTags exposes string tags', () => {
    expect(Object.keys(CacheTags).length).toBeGreaterThan(0);
    for (const value of Object.values(CacheTags)) {
      expect(typeof value).toBe('string');
    }
  });
});
