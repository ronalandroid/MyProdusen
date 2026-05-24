import { describe, expect, it } from 'vitest';
import { getFeatureFlagDefaults, isFeatureEnabled } from '@/lib/features/feature-flags';

describe('feature flag defaults', () => {
  it('keeps lean MyProdusen core enabled by default', () => {
    expect(isFeatureEnabled('attendance')).toBe(true);
    expect(isFeatureEnabled('leave')).toBe(true);
    expect(isFeatureEnabled('kpi')).toBe(true);
    expect(isFeatureEnabled('payroll')).toBe(true);
    expect(isFeatureEnabled('reports')).toBe(true);
    expect(isFeatureEnabled('pwa')).toBe(true);
    expect(isFeatureEnabled('notifications')).toBe(true);
  });

  it('hides Talenta-inspired non-core modules by default', () => {
    const defaults = getFeatureFlagDefaults();

    expect(defaults.recruitment).toBe(false);
    expect(defaults.lms).toBe(false);
    expect(defaults.reimbursement).toBe(false);
    expect(defaults.businessTravel).toBe(false);
    expect(defaults.survey).toBe(false);
    expect(defaults.asset).toBe(false);
    expect(defaults.documents).toBe(false);
    expect(defaults.announcements).toBe(false);
    expect(defaults.overtime).toBe(false);
  });
});
