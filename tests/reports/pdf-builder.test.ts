import { describe, expect, it } from 'vitest';
import { PdfBuilder } from '@/lib/reports/pdf-builder';

function decode(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString('latin1');
}

function meta() {
  return { title: 'Uji Laporan', subtitle: 'Uji Subjudul', generatedBy: 'admin@test', generatedAt: new Date('2026-07-14T03:00:00Z') };
}

describe('PdfBuilder', () => {
  it('produces a structurally valid single-page PDF', () => {
    const b = new PdfBuilder(meta());
    b.coverIntro('01 Jul — 31 Jul 2026', 'Semua divisi');
    b.statCards([{ label: 'A', value: '1' }, { label: 'B', value: '2' }]);
    const pdf = decode(b.build());
    expect(pdf.startsWith('%PDF-1.')).toBe(true);
    expect(pdf.trimEnd().endsWith('%%EOF')).toBe(true);
    expect(pdf).toContain('/Count 1');
    expect(pdf).toContain('/Type /Catalog');
  });

  it('paginates: a long table forces multiple pages with a repeated header', () => {
    const b = new PdfBuilder(meta());
    b.sectionHeader('Tabel Panjang');
    const rows = Array.from({ length: 120 }, (_, i) => [`Divisi ${i}`, String(i), String(i * 2), `Rp${i}`]);
    b.table(
      [
        { header: 'Divisi', width: 2 },
        { header: 'Hadir', width: 1, align: 'right' },
        { header: 'Telat', width: 1, align: 'right' },
        { header: 'Net', width: 1.5, align: 'right' },
      ],
      rows,
    );
    const pdf = decode(b.build());
    const countMatch = pdf.match(/\/Count (\d+)/);
    const pageCount = countMatch ? Number(countMatch[1]) : 0;
    expect(pageCount).toBeGreaterThan(1);
    // page objects and content streams both scale with page count
    expect((pdf.match(/\/Type \/Page\b/g) || []).length).toBe(pageCount);
    expect(pdf).toContain('Halaman 1 dari');
  });

  it('escapes parentheses and backslashes so the PDF is not corrupted', () => {
    const b = new PdfBuilder(meta());
    b.paragraph('Divisi (Produksi) \\ Packing');
    const pdf = decode(b.build());
    expect(pdf).toContain('Divisi \\(Produksi\\) \\\\ Packing');
  });

  it('renders a bar chart without throwing on a zero-value dataset', () => {
    const b = new PdfBuilder(meta());
    b.barChart('Kosong', [{ label: 'X', value: 0 }, { label: 'Y', value: 0 }]);
    const pdf = decode(b.build());
    expect(pdf.startsWith('%PDF')).toBe(true);
  });
});
