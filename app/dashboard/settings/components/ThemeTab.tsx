"use client";

import { Check, RefreshCcw, Save, AlertTriangle } from "lucide-react";
import type { ThemeConfig } from "./types";

type Props = {
  themeConfig: ThemeConfig;
  setThemeConfig: React.Dispatch<React.SetStateAction<ThemeConfig>>;
  saving: boolean;
  progressState: string;
  contrastValue: number;
  isContrastValid: boolean;
  handleSaveTheme: (e: React.FormEvent) => void;
  handleResetTheme: () => void;
};

export default function ThemeTab({
  themeConfig,
  setThemeConfig,
  saving,
  progressState,
  contrastValue,
  isContrastValid,
  handleSaveTheme,
  handleResetTheme,
}: Props) {
  return (
    /* activeTab === "theme" -> Color Wheel & Custom Theme settings */
    <form onSubmit={handleSaveTheme} className="grid gap-5 lg:grid-cols-[1fr_320px]">
      <div className="card p-5 sm:p-6 flex flex-col gap-5 shadow-sm bg-white border border-[var(--border-color)]">
        <div className="border-b border-[var(--border-color)] pb-3 flex justify-between items-center gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)]">Warna Tema Brand</h2>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Kustomisasi identitas warna brand aplikasi MyProdusen Anda.
            </p>
          </div>
          <button
            type="button"
            onClick={handleResetTheme}
            disabled={saving}
            className="btn btn-secondary btn-sm rounded-xl font-bold flex items-center gap-1 shrink-0"
          >
            <RefreshCcw size={14} />
            <span>Reset ke Default</span>
          </button>
        </div>

        {/* Live preview container box */}
        <div className="rounded-2xl border p-4 flex flex-col gap-3 shadow-inner bg-gray-50/20" style={{ borderColor: themeConfig.primaryColor }}>
          <p className="text-xs font-extrabold text-[var(--text-muted)] uppercase tracking-widest">Live Preview Brand</p>
          <div className="flex gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-extrabold bg-white border shadow-sm" style={{ color: themeConfig.accentColor, borderColor: themeConfig.primaryColor }}>
              Badge Kategori
            </span>
            <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white" style={{ backgroundColor: themeConfig.accentColor }}>
              Badge Aksi
            </span>
          </div>
          <button
            type="button"
            className="btn min-h-[44px] rounded-xl font-black text-sm flex items-center justify-center gap-1.5 max-w-xs shadow-md border-none"
            style={{ backgroundColor: themeConfig.primaryColor, color: themeConfig.secondaryColor }}
          >
            <Check size={16} strokeWidth={3} />
            <span>Tombol Utama Kontras</span>
          </button>
        </div>

        {/* Color wheel inputs */}
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            Warna Brand Utama (Primary)
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] p-2">
              <input
                type="color"
                className="size-10 rounded-lg cursor-pointer border-none shrink-0"
                value={themeConfig.primaryColor}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
              />
              <input
                type="text"
                maxLength={7}
                className="w-full text-sm font-bold focus:outline-none uppercase text-center"
                value={themeConfig.primaryColor}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, primaryColor: e.target.value }))}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            Warna Teks Utama (Secondary)
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] p-2">
              <input
                type="color"
                className="size-10 rounded-lg cursor-pointer border-none shrink-0"
                value={themeConfig.secondaryColor}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
              />
              <input
                type="text"
                maxLength={7}
                className="w-full text-sm font-bold focus:outline-none uppercase text-center"
                value={themeConfig.secondaryColor}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, secondaryColor: e.target.value }))}
              />
            </div>
          </label>

          <label className="flex flex-col gap-1.5 text-xs font-bold text-[var(--text-primary)]">
            Warna Aksen Penegasan (Accent)
            <div className="flex items-center gap-2 rounded-xl border border-[var(--border-color)] p-2">
              <input
                type="color"
                className="size-10 rounded-lg cursor-pointer border-none shrink-0"
                value={themeConfig.accentColor}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
              />
              <input
                type="text"
                maxLength={7}
                className="w-full text-sm font-bold focus:outline-none uppercase text-center"
                value={themeConfig.accentColor}
                onChange={(e) => setThemeConfig(prev => ({ ...prev, accentColor: e.target.value }))}
              />
            </div>
          </label>
        </div>

        {/* Contrast check feedback warning */}
        {!isContrastValid && (
          <output className="rounded-xl bg-red-50 border border-red-200 p-4 text-xs text-[var(--danger)] font-bold leading-normal flex items-start gap-2 animate-slide-up">
            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
            <span>
              ⚠️ Peringatan: Kontras warna antara Brand Utama dan Teks Utama terlalu rendah ({contrastValue.toFixed(2)}:1). Silakan pilih kombinasi dengan kontras minimal 4.5:1 untuk keterbacaan WCAG.
            </span>
          </output>
        )}

        {isContrastValid && (
          <output className="rounded-xl bg-green-50 border border-green-200 p-4 text-xs text-[var(--success)] font-semibold leading-normal flex items-start gap-2">
            <Check size={18} className="shrink-0 mt-0.5" />
            <span>
              Kombinasi warna aman! Rasio kontras ({contrastValue.toFixed(2)}:1) memenuhi rasio minimum keterbacaan WCAG AA 4.5:1.
            </span>
          </output>
        )}

        <button
          type="submit"
          disabled={saving || !isContrastValid}
          className="btn btn-primary min-h-[44px] rounded-xl font-bold flex items-center justify-center gap-1.5"
        >
          <Save size={16} />
          <span>{saving ? (progressState || "Menyimpan tema...") : "Terapkan Tema Warna"}</span>
        </button>
      </div>

      {/* Theme customizer sidebar */}
      <div className="flex flex-col gap-4">
        <div className="card p-5 flex flex-col gap-3 shadow-sm bg-gray-50/50 border border-[var(--border-color)]">
          <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">Kustomisasi Kontras</h3>
          <p className="text-xs leading-relaxed text-[var(--text-secondary)]">
            Brand Identity default kami disusun demi kenyamanan membaca tinggi.
          </p>
          <ul className="text-[11px] leading-relaxed text-[var(--text-secondary)] space-y-1.5 font-medium">
            <li><span className="inline-block size-3 rounded-full mr-1" style={{ backgroundColor: "#FFC107" }} /> <strong>Yellow #FFC107</strong> (Brand Utama)</li>
            <li><span className="inline-block size-3 rounded-full mr-1" style={{ backgroundColor: "var(--text-primary)" }} /> <strong>Charcoal var(--text-primary)</strong> (Teks Utama)</li>
            <li><span className="inline-block size-3 rounded-full mr-1" style={{ backgroundColor: "#E53935" }} /> <strong>Red #E53935</strong> (Aksen Penegasan)</li>
          </ul>
        </div>
      </div>
    </form>
  );
}
