-- Divisi kustom Superadmin (kebijakan owner 2026-07-19).
-- 1) Pastikan divisi baku + divisi baru "Kreatif" ada (idempoten — prod mungkin
--    belum pernah menjalankan seed TBM, jadi tabel Division bisa kosong).
-- 2) Backfill Employee.divisionId dari teks legacy Employee.division supaya
--    KPI per divisi & penghapusan-terblokir menghitung karyawan lama juga.
INSERT INTO "Division" ("id", "name", "code", "isActive", "createdAt", "updatedAt") VALUES
  ('division_administrasi', 'Administrasi', 'administrasi', true, now(), now()),
  ('division_produksi', 'Produksi', 'produksi', true, now(), now()),
  ('division_packing', 'Packing', 'packing', true, now(), now()),
  ('division_bege', 'BEGE', 'bege', true, now(), now()),
  ('division_kreatif', 'Kreatif', 'kreatif', true, now(), now())
ON CONFLICT ("code") DO NOTHING;--> statement-breakpoint
UPDATE "Employee" e
SET "divisionId" = d."id"
FROM "Division" d
WHERE e."divisionId" IS NULL
  AND e."division" IS NOT NULL
  AND lower(e."division") = lower(d."name");
-- CATATAN: jangan tambahkan CREATE TABLE/INDEX apa pun ke file ini. Runner
-- mem-baseline (mencatat TANPA mengeksekusi) migrasi yang objek CREATE-nya
-- sudah ada — INSERT/UPDATE di atas ikut terlewati diam-diam. Index
-- "Employee_divisionId_idx" sudah dibuat migrasi 0030.
