import ExcelJS from 'exceljs';

/**
 * Reusable professional-workbook engine for MyProdusen import/export.
 * Produces brand-styled .xlsx (frozen + bold yellow header, auto widths,
 * IDR/date number formats, optional totals) and parses uploaded sheets back
 * into header-keyed rows. Server-only (nodejs runtime).
 */

export type ColumnFormat = 'text' | 'number' | 'currency' | 'date';

export interface ExcelColumn {
  header: string;
  key: string;
  width?: number;
  format?: ColumnFormat;
}

export interface ExcelSheet {
  name: string;
  columns: ExcelColumn[];
  rows: Record<string, unknown>[];
  /** Column keys to sum into a bold TOTAL row. */
  totals?: string[];
}

const BRAND_ARGB = 'FFFFC107'; // MyProdusen yellow
const HEADER_TEXT_ARGB = 'FF1A1A1A';
const BORDER_ARGB = 'FFE5E7EB';

const NUM_FORMAT: Record<ColumnFormat, string | undefined> = {
  text: undefined,
  number: '#,##0',
  currency: '"Rp"#,##0',
  date: 'yyyy-mm-dd',
};

function applyStyles(ws: ExcelJS.Worksheet, columns: ExcelColumn[], rowCount: number): void {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: HEADER_TEXT_ARGB } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_ARGB } };
  header.alignment = { vertical: 'middle', horizontal: 'left' };
  header.height = 22;

  columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    if (!c.width) col.width = Math.max(12, c.header.length + 4);
    const fmt = c.format ? NUM_FORMAT[c.format] : undefined;
    if (fmt) col.numFmt = fmt;
  });

  // Hairline borders across the used range for a clean, printable look.
  for (let r = 1; r <= rowCount + 1; r++) {
    const row = ws.getRow(r);
    for (let c = 1; c <= columns.length; c++) {
      row.getCell(c).border = {
        top: { style: 'thin', color: { argb: BORDER_ARGB } },
        left: { style: 'thin', color: { argb: BORDER_ARGB } },
        bottom: { style: 'thin', color: { argb: BORDER_ARGB } },
        right: { style: 'thin', color: { argb: BORDER_ARGB } },
      };
    }
  }
}

export async function buildXlsx(sheets: ExcelSheet[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'MyProdusen';
  wb.created = new Date();

  for (const sheet of sheets) {
    const ws = wb.addWorksheet(sheet.name, { views: [{ state: 'frozen', ySplit: 1 }] });
    ws.columns = sheet.columns.map((c) => ({ header: c.header, key: c.key, width: c.width }));
    for (const row of sheet.rows) ws.addRow(row);

    if (sheet.totals?.length) {
      const totalRow: Record<string, unknown> = { [sheet.columns[0].key]: 'TOTAL' };
      for (const key of sheet.totals) {
        totalRow[key] = sheet.rows.reduce((sum, r) => sum + (Number(r[key]) || 0), 0);
      }
      ws.addRow(totalRow).font = { bold: true };
    }

    applyStyles(ws, sheet.columns, sheet.rows.length + (sheet.totals?.length ? 1 : 0));
  }

  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** Empty styled import template — headers + an optional example/guide row. */
export async function buildTemplateXlsx(sheet: {
  name: string;
  columns: ExcelColumn[];
  example?: Record<string, unknown>;
}): Promise<Buffer> {
  return buildXlsx([{ name: sheet.name, columns: sheet.columns, rows: sheet.example ? [sheet.example] : [] }]);
}

/**
 * Parse the first worksheet of an uploaded buffer into header-keyed rows.
 * Maps by the human header text (row 1), skips fully-empty rows, and unwraps
 * rich-text / formula / hyperlink cell objects to their plain value.
 */
export async function parseXlsx(
  buffer: Buffer,
  columns: { header: string; key: string }[],
): Promise<Record<string, unknown>[]> {
  const wb = new ExcelJS.Workbook();
  const bytes = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer;
  await wb.xlsx.load(bytes);
  const ws = wb.worksheets[0];
  if (!ws) return [];

  const headerToCol = new Map<string, number>();
  ws.getRow(1).eachCell((cell, col) => {
    headerToCol.set(String(cell.value ?? '').trim(), col);
  });

  const unwrap = (v: ExcelJS.CellValue): unknown => {
    if (v && typeof v === 'object') {
      if ('text' in v) return (v as { text: unknown }).text;
      if ('result' in v) return (v as { result: unknown }).result;
      if ('hyperlink' in v) return (v as { text?: unknown }).text ?? null;
    }
    return v ?? null;
  };

  const out: Record<string, unknown>[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const obj: Record<string, unknown> = {};
    let hasValue = false;
    for (const c of columns) {
      const col = headerToCol.get(c.header);
      const value = col ? unwrap(row.getCell(col).value) : null;
      if (value !== null && value !== undefined && String(value).trim() !== '') hasValue = true;
      obj[c.key] = value;
    }
    if (hasValue) out.push(obj);
  }
  return out;
}

/** Standard HTTP headers for an .xlsx download response. */
export function xlsxDownloadHeaders(filename: string): Record<string, string> {
  return {
    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'Content-Disposition': `attachment; filename="${filename}"`,
    'Cache-Control': 'no-store',
  };
}
