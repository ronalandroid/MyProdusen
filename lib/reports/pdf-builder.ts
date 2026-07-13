/**
 * Zero-dependency multi-page PDF builder for MyProdusen reports.
 *
 * Writes raw PDF content operators but hides the fiddly bits behind a small
 * layout API (cover, section headers, stat cards, tables that paginate, bar
 * charts, headers/footers with page numbers). No external library — safe for
 * the Next.js standalone runtime on the single VPS (no chromium, no font
 * tracing). Uses the standard-14 Helvetica fonts so nothing is embedded.
 */

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;
const CONTENT_TOP = 735; // below the header band
const CONTENT_BOTTOM = 56; // above the footer

// Brand palette (PDF colors are 0..1 RGB triplets).
export const COLORS = {
  brand: '0.internal', // placeholder overwritten below
};

const YELLOW = '1 0.757 0.027';
const INK = '0.11 0.12 0.14';
const MUTED = '0.42 0.44 0.48';
const RED = '0.898 0.224 0.208';
const GREEN = '0.18 0.49 0.20';
const CARD_BG = '0.965 0.966 0.97';
const HEADER_ROW = '0.16 0.17 0.20';
const ROW_ALT = '0.955 0.957 0.96';
const LINE = '0.85 0.86 0.88';

// Standard-14 Helvetica is WinAnsi/latin1; smart punctuation (—, …, curly
// quotes) has no latin1 code point and would be dropped/garbled. Transliterate
// to ASCII so every string renders cleanly regardless of its source.
function toLatin1Safe(text: string): string {
  return text
    .replace(/[—–]/g, '-')
    .replace(/…/g, '...')
    .replace(/[‘’‚′]/g, "'")
    .replace(/[“”„″]/g, '"')
    .replace(/[^\x00-\xFF]/g, '');
}

function esc(value: unknown, max = 200): string {
  return toLatin1Safe(String(value ?? ''))
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/[\r\n\t]+/g, ' ')
    .slice(0, max);
}

// Rough Helvetica advance width so we can truncate cells to a pixel width.
function textWidth(text: string, size: number, bold = false): number {
  return text.length * size * (bold ? 0.56 : 0.51);
}

function fit(text: string, maxWidth: number, size: number, bold = false): string {
  const clean = String(text ?? '');
  if (textWidth(clean, size, bold) <= maxWidth) return clean;
  let out = clean;
  while (out.length > 1 && textWidth(out + '...', size, bold) > maxWidth) {
    out = out.slice(0, -1);
  }
  return out + '...';
}

/** Greedy word-wrap to a pixel width, returning lines. */
function wrapText(text: string, maxWidth: number, size: number, bold = false): string[] {
  const words = String(text ?? '').split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (textWidth(candidate, size, bold) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export interface PdfMeta {
  title: string;
  subtitle: string;
  generatedBy: string;
  generatedAt: Date;
}

export interface StatCard {
  label: string;
  value: string;
  tone?: 'default' | 'good' | 'warn';
}

export interface BarDatum {
  label: string;
  value: number;
  display?: string;
}

export interface TableColumn {
  header: string;
  width: number; // relative weight
  align?: 'left' | 'right';
}

export class PdfBuilder {
  private pages: string[][] = [];
  private ops: string[] = [];
  private y = CONTENT_TOP;
  private meta: PdfMeta;

  constructor(meta: PdfMeta) {
    this.meta = meta;
    this.startPage();
  }

  private startPage() {
    if (this.ops.length) this.pages.push(this.ops);
    this.ops = [];
    this.y = CONTENT_TOP;
    this.drawPageHeader();
  }

  private drawPageHeader() {
    this.ops.push(fillRect(0, PAGE_H - 60, PAGE_W, 60, YELLOW));
    this.ops.push(fillRect(0, PAGE_H - 63, PAGE_W, 3, INK));
    this.ops.push(txt('MyProdusen', MARGIN, PAGE_H - 34, 17, 'F2', INK));
    this.ops.push(txt('Sistem HRIS Internal · Produsen Dimsum Medan', MARGIN, PAGE_H - 50, 8.5, 'F1', INK));
    this.ops.push(txt(fit(this.meta.title, 260, 11, true), PAGE_W - MARGIN - 260, PAGE_H - 32, 11, 'F2', INK, 'right', 260));
    this.ops.push(txt('TBM GROUP', PAGE_W - MARGIN - 260, PAGE_H - 48, 8.5, 'F1', INK, 'right', 260));
  }

  /** Vertical space remaining before the footer. */
  private remaining(): number {
    return this.y - CONTENT_BOTTOM;
  }

  ensureSpace(needed: number) {
    if (this.remaining() < needed) this.startPage();
  }

  gap(amount: number) {
    this.y -= amount;
  }

  // ---- Content blocks -------------------------------------------------

  coverIntro(periodLabel: string, filterLabel: string) {
    this.gap(6);
    this.ops.push(txt(this.meta.subtitle, MARGIN, this.y, 15, 'F2', INK));
    this.gap(22);
    this.ops.push(txt(`Periode: ${periodLabel}`, MARGIN, this.y, 10, 'F2', INK));
    this.gap(15);
    this.ops.push(txt(filterLabel, MARGIN, this.y, 9.5, 'F1', MUTED));
    this.gap(14);
    this.ops.push(txt(`Dibuat oleh ${this.meta.generatedBy} · ${formatStamp(this.meta.generatedAt)}`, MARGIN, this.y, 8.5, 'F1', MUTED));
    this.gap(14);
    this.ops.push(txt('RAHASIA — hanya untuk penggunaan internal MyProdusen / TBM Group.', MARGIN, this.y, 8.5, 'F2', RED));
    this.gap(20);
    this.divider();
    this.gap(18);
  }

  sectionHeader(title: string, subtitle?: string) {
    this.ensureSpace(subtitle ? 66 : 52);
    this.ops.push(fillRect(MARGIN, this.y - 22, PAGE_W - MARGIN * 2, 26, INK));
    this.ops.push(fillRect(MARGIN, this.y - 22, 5, 26, YELLOW));
    this.ops.push(txt(title, MARGIN + 14, this.y - 15, 12.5, 'F2', '1 1 1'));
    this.gap(34);
    if (subtitle) {
      this.ops.push(txt(subtitle, MARGIN, this.y, 9, 'F1', MUTED));
      this.gap(16);
    }
  }

  statCards(cards: StatCard[]) {
    const perRow = 4;
    const gapX = 10;
    const cardW = (PAGE_W - MARGIN * 2 - gapX * (perRow - 1)) / perRow;
    const cardH = 52;
    for (let i = 0; i < cards.length; i += perRow) {
      const row = cards.slice(i, i + perRow);
      this.ensureSpace(cardH + 14);
      row.forEach((card, idx) => {
        const x = MARGIN + idx * (cardW + gapX);
        const top = this.y;
        this.ops.push(fillRect(x, top - cardH, cardW, cardH, CARD_BG));
        const toneColor = card.tone === 'good' ? GREEN : card.tone === 'warn' ? RED : INK;
        this.ops.push(fillRect(x, top - cardH, 4, cardH, card.tone === 'good' ? GREEN : card.tone === 'warn' ? RED : YELLOW));
        this.ops.push(txt(fit(card.label.toUpperCase(), cardW - 18, 7.5), x + 12, top - 18, 7.5, 'F1', MUTED));
        this.ops.push(txt(fit(card.value, cardW - 18, 15, true), x + 12, top - 40, 15, 'F2', toneColor));
      });
      this.gap(cardH + 14);
    }
  }

  barChart(title: string, data: BarDatum[]) {
    if (!data.length) return;
    const rowH = 17;
    const needed = 24 + data.length * rowH + 10;
    this.ensureSpace(Math.min(needed, 200));
    this.ops.push(txt(title, MARGIN, this.y, 10, 'F2', INK));
    this.gap(20);
    const max = Math.max(...data.map((d) => d.value), 1);
    const labelW = 118;
    const trackX = MARGIN + labelW;
    const trackW = PAGE_W - MARGIN - 70 - trackX;
    data.forEach((d, index) => {
      this.ensureSpace(rowH + 4);
      const rowY = this.y;
      const barW = Math.max(3, (d.value / max) * trackW);
      this.ops.push(txt(fit(d.label, labelW - 6, 8.5), MARGIN, rowY - 9, 8.5, 'F1', INK));
      this.ops.push(fillRect(trackX, rowY - 12, trackW, 9, '0.93 0.93 0.94'));
      this.ops.push(fillRect(trackX, rowY - 12, barW, 9, index % 2 === 0 ? YELLOW : RED));
      this.ops.push(txt(d.display ?? String(d.value), trackX + trackW + 6, rowY - 9, 8.5, 'F2', INK));
      this.gap(rowH);
    });
    this.gap(10);
  }

  table(columns: TableColumn[], rows: string[][], opts: { note?: string } = {}) {
    const totalWeight = columns.reduce((s, c) => s + c.width, 0);
    const tableW = PAGE_W - MARGIN * 2;
    const widths = columns.map((c) => (c.width / totalWeight) * tableW);
    const xs: number[] = [];
    let acc = MARGIN;
    for (const w of widths) { xs.push(acc); acc += w; }
    const headerH = 20;
    const rowH = 16;

    const drawHeader = () => {
      this.ops.push(fillRect(MARGIN, this.y - headerH, tableW, headerH, HEADER_ROW));
      columns.forEach((col, i) => {
        const cellW = widths[i] - 10;
        const label = fit(col.header, cellW, 8, true);
        const tx = col.align === 'right' ? xs[i] + widths[i] - 5 : xs[i] + 5;
        this.ops.push(txt(label, tx, this.y - 13, 8, 'F2', '1 1 1', col.align === 'right' ? 'right' : 'left', cellW));
      });
      this.gap(headerH);
    };

    this.ensureSpace(headerH + rowH * 2 + 8);
    drawHeader();

    rows.forEach((row, rIdx) => {
      if (this.remaining() < rowH + 4) {
        this.startPage();
        drawHeader();
      }
      if (rIdx % 2 === 1) this.ops.push(fillRect(MARGIN, this.y - rowH, tableW, rowH, ROW_ALT));
      columns.forEach((col, i) => {
        const cellW = widths[i] - 10;
        const raw = row[i] ?? '';
        const label = fit(raw, cellW, 7.5, false);
        const tx = col.align === 'right' ? xs[i] + widths[i] - 5 : xs[i] + 5;
        this.ops.push(txt(label, tx, this.y - 11, 7.5, 'F1', INK, col.align === 'right' ? 'right' : 'left', cellW));
      });
      this.gap(rowH);
    });
    this.ops.push(strokeLine(MARGIN, this.y, PAGE_W - MARGIN, this.y, LINE));
    this.gap(6);
    if (opts.note) {
      this.ops.push(txt(opts.note, MARGIN, this.y, 7.5, 'F1', MUTED));
      this.gap(12);
    }
    this.gap(8);
  }

  paragraph(text: string, size = 9) {
    const lines = wrapText(text, PAGE_W - MARGIN * 2, size);
    const lineH = size + 4;
    lines.forEach((line) => {
      this.ensureSpace(lineH);
      this.ops.push(txt(line, MARGIN, this.y, size, 'F1', MUTED));
      this.gap(lineH);
    });
    this.gap(6);
  }

  divider() {
    this.ops.push(strokeLine(MARGIN, this.y, PAGE_W - MARGIN, this.y, LINE));
  }

  build(): Uint8Array {
    if (this.ops.length) this.pages.push(this.ops);
    const total = this.pages.length;

    // Footer with page numbers, added once the total is known.
    const pageStreams = this.pages.map((ops, index) => {
      const footer = [
        strokeLine(MARGIN, 44, PAGE_W - MARGIN, 44, LINE),
        txt('MyProdusen · TBM Group — RAHASIA', MARGIN, 32, 7.5, 'F1', MUTED),
        txt(`Halaman ${index + 1} dari ${total}`, PAGE_W - MARGIN - 120, 32, 7.5, 'F2', INK, 'right', 120),
      ];
      return [...ops, ...footer].join('\n');
    });

    return assemblePdf(pageStreams);
  }
}

// ---- Low-level content operators --------------------------------------

function txt(
  text: string,
  x: number,
  y: number,
  size: number,
  font: 'F1' | 'F2',
  color: string,
  align: 'left' | 'right' = 'left',
  boxWidth = 0,
): string {
  const bold = font === 'F2';
  const drawX = align === 'right' ? x - textWidth(String(text), size, bold) : x;
  void boxWidth;
  return `q BT ${color} rg /${font} ${size} Tf ${drawX.toFixed(2)} ${y.toFixed(2)} Td (${esc(text)}) Tj ET Q`;
}

function fillRect(x: number, y: number, w: number, h: number, color: string): string {
  return `q ${color} rg ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f Q`;
}

function strokeLine(x1: number, y1: number, x2: number, y2: number, color: string): string {
  return `q ${color} RG 0.7 w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S Q`;
}

function formatStamp(date: Date): string {
  try {
    return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(date) + ' WIB';
  } catch {
    return date.toISOString();
  }
}

function assemblePdf(pageStreams: string[]): Uint8Array {
  // Object layout:
  // 1 Catalog, 2 Pages, 3 F1, 4 F2, then per page: [Page obj, Content obj]
  const pageCount = pageStreams.length;
  const firstPageObj = 5;
  const pageObjIds: number[] = [];
  for (let i = 0; i < pageCount; i++) pageObjIds.push(firstPageObj + i * 2);

  const objects: string[] = [];
  objects.push('<< /Type /Catalog /Pages 2 0 R >>');
  objects.push(`<< /Type /Pages /Kids [${pageObjIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageCount} >>`);
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  objects.push('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>');

  pageStreams.forEach((stream, i) => {
    const contentId = pageObjIds[i] + 1;
    objects.push(
      `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
        `/Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${contentId} 0 R >>`,
    );
    objects.push(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`);
  });

  let pdf = '%PDF-1.4\n%âãÏÓ\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'latin1'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'latin1');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Uint8Array(Buffer.from(pdf, 'latin1'));
}
