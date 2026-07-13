"use client";

import { DoorClosed, DoorOpen, ShieldCheck } from "lucide-react";

type Props = {
  isOpen: boolean;
  saving: boolean;
  onToggle: (nextOpen: boolean) => void;
};

export default function RegistrationTab({ isOpen, saving, onToggle }: Props) {
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card p-5 sm:p-6 flex flex-col gap-5 shadow-sm bg-white border border-[var(--border-color)]">
        <div className="border-b border-[var(--border-color)] pb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Pendaftaran Akun Publik</h2>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Kendalikan apakah halaman <span className="font-semibold">/register</span> menerima pendaftaran karyawan baru.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-4 justify-between rounded-2xl border border-[var(--border-color)] bg-[var(--bg-secondary,#f8f8f8)] p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${isOpen ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
              {isOpen ? <DoorOpen size={20} aria-hidden="true" /> : <DoorClosed size={20} aria-hidden="true" />}
            </div>
            <div>
              <p className="text-sm font-extrabold text-[var(--text-primary)]">
                Status saat ini: {isOpen ? "DIBUKA" : "DITUTUP"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {isOpen
                  ? "Siapa pun dapat mendaftar dan akunnya langsung aktif."
                  : "Halaman register menampilkan pemberitahuan tutup; API menolak pendaftaran baru."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onToggle(!isOpen)}
            disabled={saving}
            aria-pressed={!isOpen}
            className={`btn min-h-11 px-5 font-bold rounded-xl transition-colors disabled:opacity-60 ${
              isOpen
                ? "bg-amber-500 text-white hover:bg-amber-600"
                : "bg-[var(--primary)] text-[var(--text-primary)] hover:bg-[var(--primary-hover)]"
            }`}
          >
            {saving ? "Menyimpan..." : isOpen ? "Tutup Pendaftaran" : "Buka Pendaftaran"}
          </button>
        </div>
      </div>

      <aside className="card p-5 shadow-sm bg-white border border-[var(--border-color)] h-fit">
        <div className="flex items-center gap-2 mb-3">
          <ShieldCheck size={18} className="text-[var(--primary-dark)]" aria-hidden="true" />
          <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Kapan sebaiknya ditutup?</h3>
        </div>
        <ul className="space-y-2 text-xs text-[var(--text-secondary)] leading-relaxed list-disc pl-4">
          <li>Semua karyawan sudah punya akun dan tidak ada rekrutmen berjalan.</li>
          <li>Ada indikasi pendaftaran liar / spam yang lolos proteksi otomatis.</li>
          <li>Masa rekrutmen selesai — buka lagi kapan saja saat gelombang berikutnya.</li>
        </ul>
        <p className="mt-3 text-xs text-[var(--text-muted)]">
          Saat ditutup, akun tetap bisa dibuat manual dari menu <span className="font-semibold">Pengguna</span>.
        </p>
      </aside>
    </div>
  );
}
