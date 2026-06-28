import { describe, it, expect } from 'vitest';
import { buildXlsx, buildTemplateXlsx, parseXlsx } from '@/lib/excel/workbook';

const columns = [
  { header: 'NIP', key: 'nip', format: 'text' as const },
  { header: 'Nama', key: 'name', format: 'text' as const },
  { header: 'Gaji', key: 'salary', format: 'currency' as const },
];

describe('excel workbook engine', () => {
  it('builds a non-empty xlsx buffer', async () => {
    const buf = await buildXlsx([{ name: 'Test', columns, rows: [{ nip: 'A1', name: 'Budi', salary: 5_000_000 }] }]);
    expect(Buffer.isBuffer(buf)).toBe(true);
    expect(buf.length).toBeGreaterThan(0);
    // xlsx files are zip archives — they start with the PK signature.
    expect(buf.subarray(0, 2).toString('latin1')).toBe('PK');
  });

  it('round-trips rows through build -> parse by header', async () => {
    const rows = [
      { nip: 'A1', name: 'Budi', salary: 5_000_000 },
      { nip: 'A2', name: 'Sari', salary: 7_250_000 },
    ];
    const buf = await buildXlsx([{ name: 'Karyawan', columns, rows }]);
    const parsed = await parseXlsx(buf, columns);
    expect(parsed).toHaveLength(2);
    expect(parsed[0]).toMatchObject({ nip: 'A1', name: 'Budi', salary: 5_000_000 });
    expect(parsed[1]).toMatchObject({ nip: 'A2', name: 'Sari', salary: 7_250_000 });
  });

  it('skips fully empty rows on parse', async () => {
    const buf = await buildXlsx([{ name: 'K', columns, rows: [{ nip: 'A1', name: 'Budi', salary: 1 }, {}] }]);
    const parsed = await parseXlsx(buf, columns);
    expect(parsed).toHaveLength(1);
  });

  it('appends a bold TOTAL row for summed columns', async () => {
    const buf = await buildXlsx([{ name: 'K', columns, rows: [{ nip: 'A1', name: 'x', salary: 100 }, { nip: 'A2', name: 'y', salary: 250 }], totals: ['salary'] }]);
    const parsed = await parseXlsx(buf, columns);
    const total = parsed.find((r) => r.nip === 'TOTAL');
    expect(total?.salary).toBe(350);
  });

  it('builds a template with headers and an example row', async () => {
    const buf = await buildTemplateXlsx({ name: 'Template', columns, example: { nip: 'contoh: 240101', name: 'contoh: Budi', salary: 5000000 } });
    const parsed = await parseXlsx(buf, columns);
    expect(parsed).toHaveLength(1);
    expect(String(parsed[0].nip)).toContain('contoh');
  });
});
