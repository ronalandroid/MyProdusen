import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

function read(path: string) {
  return readFileSync(path, 'utf8');
}

describe('final production UI wiring source checks', () => {
  it('audit dashboard uses API data with loading, empty, pagination, and no static dummy rows', () => {
    const source = read('app/dashboard/audit/page.tsx');
    expect(source).not.toContain('const auditData');
    expect(source).toContain('fetch(`/api/audit?${params.toString()}`');
    expect(source).toContain('Memuat audit log');
    expect(source).toContain('Tidak ada audit log');
    expect(source).toContain('PAGE_SIZE');
    expect(source).toContain('Export halaman ini');
  });

  it('shift dashboard writes through backend API and does not use static shift data', () => {
    const source = read('app/dashboard/shifts/page.tsx');
    expect(source).not.toContain('const shiftsData');
    expect(source).toContain('fetch("/api/shifts"');
    expect(source).toContain('method: editingShift ? "PUT" : "POST"');
    expect(source).toContain('toggleShift');
    expect(source).toContain('Belum ada shift');
  });

  it('KPI dashboard reads real KPI endpoints and has no simulated production save', () => {
    const source = read('app/dashboard/kpi/page.tsx');
    expect(source).not.toContain('Placeholder data');
    expect(source).not.toContain('setTimeout');
    expect(source).not.toContain('Simulasi');
    expect(source).toContain('/api/kpi/results?period=');
    expect(source).toContain('/api/kpi/employee/');
    expect(source).toContain('Belum ada hasil KPI');
  });

  it('audit API enforces Superadmin and caps pagination parameters', () => {
    const source = read('app/api/audit/route.ts');
    expect(source).toContain("user.role !== 'SUPERADMIN'");
    expect(source).toContain('Math.min(Math.max(parsedLimit, 1), 100)');
    expect(source).toContain('filters.offset');
    expect(source).toContain('filters.search');
  });
});
