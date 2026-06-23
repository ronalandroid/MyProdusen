import { describe, it, expect } from 'vitest';
import { rowsToCsv, csvResponse } from './csv-export';

describe('rowsToCsv', () => {
  it('builds a header row followed by data rows', () => {
    const csv = rowsToCsv(
      [{ name: 'Budi', age: 30 }],
      [
        { key: 'name', label: 'Nama' },
        { key: 'age', label: 'Umur' },
      ],
    );
    expect(csv).toBe('Nama,Umur\nBudi,30');
  });

  it('returns only the header when there are no rows', () => {
    expect(rowsToCsv([], [{ key: 'name', label: 'Nama' }])).toBe('Nama');
  });

  it('renders empty cells for null/undefined values', () => {
    const csv = rowsToCsv(
      [{ a: null, b: undefined }],
      [
        { key: 'a', label: 'A' },
        { key: 'b', label: 'B' },
      ],
    );
    expect(csv).toBe('A,B\n,');
  });

  it('quotes and escapes values with commas, quotes, or newlines', () => {
    const csv = rowsToCsv([{ v: 'a,"b"\nc' }], [{ key: 'v', label: 'V' }]);
    expect(csv).toBe('V\n"a,""b""\nc"');
  });
});

describe('csvResponse', () => {
  it('sets the csv content-type and attachment filename', () => {
    const res = csvResponse('a,b', 'report.csv');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('report.csv');
  });
});
