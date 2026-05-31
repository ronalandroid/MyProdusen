import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const route = readFileSync('app/api/leader/kpi-production/route.ts', 'utf8');
const verify = readFileSync('scripts/verify-uat-leader-flow.mjs', 'utf8');

describe('leader KPI production route source', () => {
  it('accepts direct array payload used by authenticated Leader E2E', () => {
    expect(route).toContain('Array.isArray(body) ? body');
    expect(route).toContain('Array.isArray(body.entries) ? body.entries');
  });

  it('UAT verify uses stable official location id instead of brittle coordinate/radius exact match', () => {
    expect(verify).toContain("id = 'loc_produsen_dimsum_medan_tbm_grup'");
    expect(verify).toContain('"isActive" = true');
    expect(verify).not.toContain('latitude = 3.6009125 and longitude = 98.6964954 and radius = 100');
  });
});
