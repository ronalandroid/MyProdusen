import { and, eq, inArray, or, sql, type SQL } from 'drizzle-orm';
import { db, divisions, employees, positions, payrollRules } from '@/lib/db';
import { BusinessError } from '@/lib/core/business-error';
import { AppError } from '@/lib/core/app-error';
import { publishRealtimeEvent, createRealtimeEvent } from '@/lib/realtime/publisher';

/**
 * Divisi yang bisa dikustomisasi Superadmin (kebijakan owner 2026-07-19).
 * Sumber kebenaran adalah tabel Division; kolom teks legacy Employee.division
 * tetap ditulis (dual-write) supaya laporan lama yang group-by teks ikut sinkron.
 * Penghapusan DIBLOKIR selama masih ada karyawan aktif, posisi, atau aturan
 * gaji yang menunjuk divisi itu — pilihan eksplisit owner ("blokir sampai kosong").
 */

export interface DivisionSummary {
  id: string;
  name: string;
  code: string;
  description: string | null;
  isActive: boolean;
  memberCount: number;
}

const MIN_NAME_LENGTH = 2;
const MAX_NAME_LENGTH = 60;

export function slugifyDivisionName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function broadcastDivisionsUpdated() {
  await publishRealtimeEvent(
    createRealtimeEvent({ type: 'divisions.updated', scope: 'global', payload: {} }),
  );
}

/**
 * Kesetaraan nama case-insensitive. JANGAN pakai ilike di sini: nama divisi
 * adalah input pengguna, dan % / _ di dalamnya menjadi wildcard ilike — nama
 * "100%" bisa mencocokkan (dan me-rename!) teks divisi karyawan lain.
 */
function nameEquals(column: typeof employees.division | typeof divisions.name, name: string): SQL {
  return sql`lower(${column}) = lower(${name})`;
}

/** Karyawan aktif yang tertaut ke divisi — via divisionId ATAU teks legacy. */
function activeMemberCondition(divisionId: string, divisionName: string) {
  return and(
    eq(employees.status, 'ACTIVE'),
    or(eq(employees.divisionId, divisionId), nameEquals(employees.division, divisionName)),
  );
}

/** Sinkronkan teks legacy karyawan setiap kali nama divisi berubah. */
async function syncEmployeeDivisionText(divisionId: string, oldName: string, newName: string) {
  if (oldName === newName) return;
  await db
    .update(employees)
    .set({ division: newName })
    .where(or(eq(employees.divisionId, divisionId), nameEquals(employees.division, oldName)));
}

export const divisionService = {
  async listDivisions(filters?: { includeInactive?: boolean }): Promise<DivisionSummary[]> {
    const rows = await db
      .select()
      .from(divisions)
      .where(filters?.includeInactive ? undefined : eq(divisions.isActive, true))
      .orderBy(divisions.name);

    if (rows.length === 0) return [];

    // Two grouped counts instead of N per-division queries; merged in memory.
    const idCounts = await db
      .select({ divisionId: employees.divisionId, total: sql<number>`cast(count(*) as int)` })
      .from(employees)
      .where(and(eq(employees.status, 'ACTIVE'), inArray(employees.divisionId, rows.map((r) => r.id))))
      .groupBy(employees.divisionId);

    const textCounts = await db
      .select({ division: sql<string>`lower(${employees.division})`, total: sql<number>`cast(count(*) as int)` })
      .from(employees)
      .where(and(eq(employees.status, 'ACTIVE'), sql`${employees.divisionId} is null`))
      .groupBy(sql`lower(${employees.division})`);

    const byId = new Map(idCounts.map((c) => [c.divisionId, c.total]));
    const byText = new Map(textCounts.map((c) => [c.division, c.total]));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      description: row.description,
      isActive: row.isActive,
      memberCount: (byId.get(row.id) ?? 0) + (byText.get(row.name.toLowerCase()) ?? 0),
    }));
  },

  /**
   * Hanya divisi AKTIF — divisi nonaktif tersembunyi dari semua pilihan, jadi
   * jalur tulis (termasuk registrasi publik yang mengetik nama bebas) tidak
   * boleh diam-diam menautkan karyawan ke divisi yang sudah dipensiunkan.
   */
  async findDivisionByName(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return null;
    const [row] = await db
      .select()
      .from(divisions)
      .where(and(eq(divisions.isActive, true), nameEquals(divisions.name, trimmed)))
      .limit(1);
    return row ?? null;
  },

  async createDivision(data: { name: string; description?: string }) {
    const name = data.name.trim();
    if (name.length < MIN_NAME_LENGTH || name.length > MAX_NAME_LENGTH) {
      throw AppError.validation(`Nama divisi harus ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} karakter`);
    }
    const code = slugifyDivisionName(name);
    if (!code) throw AppError.validation('Nama divisi tidak valid');

    const [existing] = await db.select().from(divisions).where(eq(divisions.code, code)).limit(1);
    if (existing) {
      if (existing.isActive) {
        throw new BusinessError(`Divisi "${existing.name}" sudah ada`);
      }
      // Divisi lama yang dinonaktifkan dihidupkan lagi — riwayat lama tetap tertaut.
      const [revived] = await db
        .update(divisions)
        .set({ name, isActive: true, description: data.description ?? existing.description, updatedAt: new Date() })
        .where(eq(divisions.id, existing.id))
        .returning();
      // Revival bisa mengganti nama tampilan (slug sama, mis. "Gudang Utama" →
      // "Gudang-Utama") — teks legacy karyawan wajib ikut, sama seperti rename
      // biasa, agar memberCount dan blokir-hapus tetap melihat mereka.
      await syncEmployeeDivisionText(existing.id, existing.name, name);
      await broadcastDivisionsUpdated();
      return revived;
    }

    const [created] = await db
      .insert(divisions)
      .values({
        id: `division_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
        name,
        code,
        description: data.description ?? null,
        isActive: true,
      })
      .returning();
    await broadcastDivisionsUpdated();
    return created;
  },

  async updateDivision(id: string, data: { name?: string; description?: string; isActive?: boolean }) {
    const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
    if (!division) throw AppError.notFound('Divisi tidak ditemukan');

    const nextName = data.name?.trim();
    if (nextName !== undefined) {
      if (nextName.length < MIN_NAME_LENGTH || nextName.length > MAX_NAME_LENGTH) {
        throw AppError.validation(`Nama divisi harus ${MIN_NAME_LENGTH}-${MAX_NAME_LENGTH} karakter`);
      }
      const nextCode = slugifyDivisionName(nextName);
      const [clash] = await db
        .select({ id: divisions.id })
        .from(divisions)
        .where(and(eq(divisions.code, nextCode), sql`${divisions.id} <> ${id}`))
        .limit(1);
      if (clash) throw new BusinessError(`Divisi dengan nama "${nextName}" sudah ada`);
    }

    const [updated] = await db
      .update(divisions)
      .set({
        ...(nextName !== undefined ? { name: nextName, code: slugifyDivisionName(nextName) } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
        updatedAt: new Date(),
      })
      .where(eq(divisions.id, id))
      .returning();

    // Dual-write: teks legacy di Employee ikut ganti nama supaya laporan
    // group-by teks & dropdown lama tetap konsisten.
    if (nextName !== undefined) {
      await syncEmployeeDivisionText(id, division.name, nextName);
    }

    await broadcastDivisionsUpdated();
    return updated;
  },

  async deleteDivision(id: string) {
    const [division] = await db.select().from(divisions).where(eq(divisions.id, id)).limit(1);
    if (!division) throw AppError.notFound('Divisi tidak ditemukan');

    const [[memberRow], [positionRow], [ruleRow]] = await Promise.all([
      db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(employees)
        .where(activeMemberCondition(id, division.name)),
      db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(positions)
        .where(and(eq(positions.divisionId, id), eq(positions.isActive, true))),
      db
        .select({ total: sql<number>`cast(count(*) as int)` })
        .from(payrollRules)
        .where(and(eq(payrollRules.divisionId, id), eq(payrollRules.isActive, true))),
    ]);

    if (memberRow.total > 0) {
      throw new BusinessError(
        `Divisi "${division.name}" masih punya ${memberRow.total} karyawan aktif. Pindahkan dulu karyawannya, lalu hapus.`,
      );
    }
    if (positionRow.total > 0 || ruleRow.total > 0) {
      throw new BusinessError(
        `Divisi "${division.name}" masih dipakai oleh ${positionRow.total} posisi dan ${ruleRow.total} aturan gaji. Nonaktifkan saja, atau bersihkan dulu referensinya.`,
      );
    }

    // Hitungan di atas hanya untuk pesan yang ramah. Penjaga sebenarnya ada di
    // DELETE bersyarat satu-statement di bawah (anti-TOCTOU): assignment yang
    // masuk di antara hitung dan hapus tetap membatalkan penghapusan.
    const removed = await this.attemptAtomicDelete(id, division.name);
    if (!removed) {
      throw new BusinessError(
        `Divisi "${division.name}" baru saja dipakai (karyawan/posisi/aturan gaji ditambahkan bersamaan). Muat ulang lalu coba lagi.`,
      );
    }

    await broadcastDivisionsUpdated();
    return { deleted: true as const, id, name: division.name };
  },

  /**
   * DELETE bersyarat dalam SATU statement: semua pemeriksaan referensi berjalan
   * di snapshot statement yang sama, jadi tidak ada jendela balapan antara
   * "cek kosong" dan "hapus". Mengembalikan false bila divisi masih dipakai.
   */
  async attemptAtomicDelete(id: string, divisionName: string): Promise<boolean> {
    const rows = await db.execute(sql`
      DELETE FROM "Division" d
      WHERE d."id" = ${id}
        AND NOT EXISTS (
          SELECT 1 FROM "Employee" e
          WHERE e."status" = 'ACTIVE'
            AND (e."divisionId" = ${id} OR lower(e."division") = lower(${divisionName}))
        )
        AND NOT EXISTS (
          SELECT 1 FROM "Position" p WHERE p."divisionId" = ${id} AND p."isActive" = true
        )
        AND NOT EXISTS (
          SELECT 1 FROM "PayrollRule" r WHERE r."divisionId" = ${id} AND r."isActive" = true
        )
      RETURNING d."id"
    `);
    return rows.length > 0;
  },
};
