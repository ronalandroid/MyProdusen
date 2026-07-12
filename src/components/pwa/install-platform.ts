export type InstallPlatform = "ios" | "macos-safari" | "android" | "other";

export type InstallGuide = {
  platform: InstallPlatform;
  /** Whether this browser can ever fire `beforeinstallprompt` (Chromium-only API). */
  expectsInstallPrompt: boolean;
  /** Primary-action label: real install on Chromium, how-to reveal elsewhere. */
  buttonLabel: "Install App" | "Lihat Caranya";
  /** Manual install steps, shown when no native prompt is available. */
  steps: string[];
};

type GuideInput = {
  userAgent: string;
  maxTouchPoints: number;
};

const IOS_STEPS = [
  "Ketuk tombol Bagikan (kotak dengan panah ke atas) di bilah Safari.",
  "Gulir lalu pilih “Tambahkan ke Layar Utama” (Add to Home Screen).",
  "Ketuk “Tambah” — ikon MyProdusen muncul di layar utama HP Anda.",
];

const MACOS_SAFARI_STEPS = [
  "Buka menu “File” di bilah menu Safari.",
  "Pilih “Add to Dock” (Tambahkan ke Dock).",
  "Konfirmasi — MyProdusen terpasang seperti aplikasi Mac.",
];

const ANDROID_STEPS = [
  "Buka menu ⋮ di pojok kanan atas Chrome.",
  "Pilih “Instal aplikasi” atau “Tambahkan ke layar utama”.",
  "Konfirmasi — ikon MyProdusen muncul di layar utama.",
];

const GENERIC_STEPS = [
  "Cari ikon instal di ujung kanan kolom alamat browser.",
  "Atau buka menu browser lalu pilih “Instal MyProdusen”.",
  "Konfirmasi — MyProdusen terbuka sebagai aplikasi tersendiri.",
];

function isIos(ua: string, maxTouchPoints: number): boolean {
  if (/iphone|ipad|ipod/.test(ua)) return true;
  // iPadOS 13+ reports a desktop macOS user agent; touch support unmasks it.
  return ua.includes("macintosh") && maxTouchPoints > 1;
}

function isMacosSafari(ua: string): boolean {
  if (!ua.includes("macintosh") || !ua.includes("safari")) return false;
  // Chromium browsers keep "Safari" in their UA; "Version/" only appears in real Safari.
  return ua.includes("version/") && !/chrome|chromium|crios|edg|opr\//.test(ua);
}

export function resolveInstallGuide(input: GuideInput): InstallGuide {
  const ua = input.userAgent.toLowerCase();

  if (isIos(ua, input.maxTouchPoints)) {
    return { platform: "ios", expectsInstallPrompt: false, buttonLabel: "Lihat Caranya", steps: IOS_STEPS };
  }

  if (isMacosSafari(ua)) {
    return { platform: "macos-safari", expectsInstallPrompt: false, buttonLabel: "Lihat Caranya", steps: MACOS_SAFARI_STEPS };
  }

  if (/android/.test(ua)) {
    return { platform: "android", expectsInstallPrompt: true, buttonLabel: "Install App", steps: ANDROID_STEPS };
  }

  return { platform: "other", expectsInstallPrompt: true, buttonLabel: "Install App", steps: GENERIC_STEPS };
}
