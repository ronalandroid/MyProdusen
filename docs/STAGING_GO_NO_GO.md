# Staging Go / No-Go — MyProdusen

Dokumen ini menentukan keputusan setelah UAT staging. Produksi hanya boleh lanjut jika semua kriteria Go terpenuhi atau risiko tertulis diterima Owner + HR + Teknis.

## Go Criteria

- [ ] Coolify deploy healthy.
- [ ] `/api/health` HTTP 200 dan tidak membocorkan secret.
- [ ] Env validation pass.
- [ ] DB migration pass.
- [ ] `/app/uploads` mounted dan writable.
- [ ] Public landing, login, register, forgot password terbuka.
- [ ] Resend activation email berhasil.
- [ ] Resend forgot/reset password berhasil.
- [ ] Superadmin bisa membuka `/dashboard/users`.
- [ ] Superadmin bisa activate/deactivate user.
- [ ] Superadmin bisa change role.
- [ ] Employee dibuat dengan NIP unik.
- [ ] Work location dibuat.
- [ ] Shift dibuat.
- [ ] Employee assigned ke shift/location.
- [ ] Android GPS + realtime selfie check-in berhasil.
- [ ] Android GPS + realtime selfie check-out berhasil.
- [ ] Protected selfie access sesuai role.
- [ ] Unauthorized selfie access diblokir.
- [ ] Leave workflow berhasil dan rejection wajib alasan.
- [ ] KPI workflow berhasil.
- [ ] Payroll employee view dan Superadmin summary berhasil.
- [ ] Payroll approve/mark paid protected.
- [ ] CSV export berhasil dan audited.
- [ ] Superadmin PDF berhasil.
- [ ] Non-Superadmin PDF diblokir.
- [ ] Audit logs muncul untuk aksi sensitif.
- [ ] Notifications muncul dan mark read berhasil.
- [ ] Database backup verified.
- [ ] Upload backup verified.
- [ ] Restore drill staging/test berhasil.
- [ ] Mobile 360px dan 390px tidak overflow.
- [ ] Desktop 1440px rapi.

## No-Go Criteria

Jika salah satu terjadi, jangan lanjut produksi:

- [ ] Env secret missing atau invalid.
- [ ] DB migration gagal.
- [ ] `/api/health` gagal.
- [ ] Upload volume tidak writable.
- [ ] Upload/selfie public bisa diakses langsung.
- [ ] Employee bisa melihat payroll/selfie employee lain.
- [ ] Supervisor bisa melihat data luar tim tanpa permission.
- [ ] Non-Superadmin bisa akses PDF report.
- [ ] Android GPS/selfie check-in/out gagal.
- [ ] Resend activation/reset gagal.
- [ ] Payroll approve/paid RBAC gagal.
- [ ] Audit log sensitive action tidak tercatat.
- [ ] Backup atau restore drill gagal.
- [ ] Mobile layout overflow parah atau tombol utama tidak bisa ditap.

## Decision

| Item | Isi |
| --- | --- |
| Tanggal keputusan |  |
| Release / Commit |  |
| Owner approval | GO / NO-GO |
| HR approval | GO / NO-GO |
| Technical approval | GO / NO-GO |
| Final decision | GO / NO-GO |
| Catatan risiko diterima |  |
| Next action |  |
