import { describe, it, expect } from 'vitest';
import {
  navigationPolicy,
  navigationGroups,
  getNavigationForRole,
  getGroupedNavigationForRole,
} from '@/lib/navigation/role-navigation';
import type { UserRole } from '@/lib/permissions';

const GROUP_KEYS = navigationGroups.map((g) => g.key);
const MAX_ITEMS_PER_GROUP = 8;

describe('navigation grouping', () => {
  it('every policy item declares a known group', () => {
    for (const item of navigationPolicy) {
      expect(GROUP_KEYS, `item ${item.key} has unknown group ${item.group}`).toContain(item.group);
    }
  });

  it('every group has a non-empty label', () => {
    for (const group of navigationGroups) {
      expect(group.label.length).toBeGreaterThan(0);
    }
  });

  const roles: UserRole[] = ['SUPERADMIN', 'LEADER', 'EMPLOYEE'];
  for (const role of roles) {
    it(`groups for ${role} preserve canonical order and drop empty groups`, () => {
      const grouped = getGroupedNavigationForRole(role);
      // no empty groups
      expect(grouped.every((g) => g.items.length > 0)).toBe(true);
      // canonical order preserved (subsequence of navigationGroups order)
      const order = grouped.map((g) => g.key);
      const canonical = GROUP_KEYS.filter((k) => order.includes(k));
      expect(order).toEqual(canonical);
    });

    it(`no group for ${role} exceeds ${MAX_ITEMS_PER_GROUP} items`, () => {
      for (const group of getGroupedNavigationForRole(role)) {
        expect(group.items.length, `${role}/${group.key} too long`).toBeLessThanOrEqual(MAX_ITEMS_PER_GROUP);
      }
    });

    it(`grouped items for ${role} exactly cover the flat nav (no loss, no dupes)`, () => {
      const flat = getNavigationForRole(role).map((i) => i.key).sort();
      const grouped = getGroupedNavigationForRole(role)
        .flatMap((g) => g.items.map((i) => i.key))
        .sort();
      expect(grouped).toEqual(flat);
    });
  }

  it('respects role filtering (employee never sees superadmin-only groups items)', () => {
    const employeeKeys = getGroupedNavigationForRole('EMPLOYEE').flatMap((g) => g.items.map((i) => i.key));
    expect(employeeKeys).not.toContain('audit');
    expect(employeeKeys).not.toContain('employees');
    expect(employeeKeys).toContain('attendance');
  });
});
