# Ringkasan Formula Payroll — untuk Tanda Tangan Owner

**MyProdusen · Produsen Dimsum Medan**
Dokumen ini menjelaskan rumus gaji yang dipakai sistem. Tanda tangan owner di
bawah = persetujuan bahwa rumus ini benar untuk dipakai produksi.

> Sumber kebenaran: `lib/payroll/calculations.ts` (teruji di
> `lib/payroll/calculations.test.ts` + `tests/payroll/payroll-orchestrator.integration.test.ts`).
> Angka di 3 slip contoh (`sample-slip-A/B/C.pdf`) dihitung dengan rumus persis ini.

## 1. Konstanta

| Konstanta | Nilai |
|---|---|
| Hari kerja per bulan | **22** |
| PTKP (penghasilan tidak kena pajak) bulanan | **Rp 4.500.000** (Rp 54 jt/tahun) |

## 2. Gross (Bruto)

```
Gross = Gaji Pokok + Tunjangan + Lembur + Bonus
```

## 3. Potongan

### a. BPJS (dihitung dari Gaji Pokok)
| Komponen | Karyawan | Perusahaan |
|---|---|---|
| BPJS Kesehatan | 1% | 4% |
| BPJS Ketenagakerjaan | 2% | 3,7% |

Yang memotong slip karyawan: **Kesehatan 1% + Ketenagakerjaan 2%**.

### b. PPh 21 (dihitung dari Gross, progresif setelah PTKP)
```
Penghasilan Kena Pajak (PKP) = max(0, Gross − 4.500.000)
```
| Lapisan PKP | Tarif |
|---|---|
| s/d 5.000.000 | 5% |
| 5.000.001 – 25.000.000 | 15% |
| 25.000.001 – 50.000.000 | 25% |
| > 50.000.000 | 30% |

### c. Potongan Kehadiran
```
Potongan = Jumlah Hari Alpa (ABSENT) × (Gaji Pokok ÷ 22)
```

## 4. Net (Take-Home Pay)
```
Net = Gross − (BPJS Kesehatan + BPJS Ketenagakerjaan + PPh 21 + Potongan Kehadiran)
```

## 5. ⚠️ Yang BELUM ada di sistem (keputusan owner diperlukan)

Dua hal ini **tidak diterapkan** di kode saat ini. Sistem **tidak** otomatis melakukannya:

| Fitur | Status | Dampak |
|---|---|---|
| **Potongan keterlambatan (late penalty)** | ❌ Tidak ada | Terlambat **dicatat** (jumlah hari telat tampil di slip) tapi **tidak** memotong gaji |
| **Prorate gaji karyawan resign tengah bulan** | ❌ Tidak ada | Karyawan resign tgl 15 tetap dihitung gaji penuh kecuali ditandai alpa |

> Jika owner ingin salah satu/keduanya diterapkan, perlu keputusan aturannya
> (mis. nominal penalti per keterlambatan; basis prorate: hari kalender vs hari kerja),
> baru dikembangkan sebagai fitur baru + diuji. **Tidak ditambahkan diam-diam** karena
> berdampak langsung ke gaji.

## 6. Contoh (3 slip terlampir, angka cocok dengan test otomatis)

| Slip | Gaji Pokok | Skenario | Gross | Total Potongan | **Net** |
|---|---|---|---|---|---|
| A | 3.000.000 | Full hadir | 3.000.000 | 90.000 | **2.910.000** |
| B | 3.000.000 | + Lembur 8 jam (400.000) | 3.400.000 | 90.000 | **3.310.000** |
| C | 4.000.000 | 2 hari alpa | 4.000.000 | 483.636 | **3.516.364** |

---

**Disetujui Owner:** _______________________  Tanggal: ___________

**Disiapkan oleh:** _______________________  Tanggal: ___________
