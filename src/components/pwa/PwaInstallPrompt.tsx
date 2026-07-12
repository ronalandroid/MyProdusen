"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, X } from "lucide-react";
import { resolveInstallGuide } from "./install-platform";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISSED_KEY = "myprodusen_pwa_install_dismissed_at";
const INSTALLED_KEY = "myprodusen_pwa_installed";
const DISMISS_MS = 7 * 24 * 60 * 60 * 1000;

function isStandaloneMode() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(display-mode: standalone)").matches || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
}

function recentlyDismissed() {
  const dismissedAt = Number(window.localStorage.getItem(DISMISSED_KEY) || "0");
  return Number.isFinite(dismissedAt) && Date.now() - dismissedAt < DISMISS_MS;
}

function isAutomatedTestBrowser() {
  return typeof navigator !== "undefined" && navigator.webdriver === true;
}

export default function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  const guide = useMemo(() => {
    if (typeof navigator === "undefined") return resolveInstallGuide({ userAgent: "", maxTouchPoints: 0 });
    return resolveInstallGuide({ userAgent: navigator.userAgent, maxTouchPoints: navigator.maxTouchPoints ?? 0 });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (isAutomatedTestBrowser()) return;
    if (isStandaloneMode() || window.localStorage.getItem(INSTALLED_KEY) === "true" || recentlyDismissed()) return;

    const onBeforeInstallPrompt = (event: Event) => {
      if (isStandaloneMode() || recentlyDismissed() || window.localStorage.getItem(INSTALLED_KEY) === "true") return;
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setShowInstructions(false);
      setIsVisible(true);
    };

    const onInstalled = () => {
      window.localStorage.setItem(INSTALLED_KEY, "true");
      setIsVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onInstalled);

    const fallbackTimer = window.setTimeout(() => {
      if (!isStandaloneMode() && !recentlyDismissed() && !window.localStorage.getItem(INSTALLED_KEY)) {
        setShowInstructions(true);
        setIsVisible(true);
      }
    }, 3500);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onInstalled);
      window.clearTimeout(fallbackTimer);
    };
  }, []);

  if (isAutomatedTestBrowser()) return null;

  async function installApp() {
    if (!deferredPrompt) {
      setShowInstructions(true);
      return;
    }

    setIsInstalling(true);
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === "accepted") {
        window.localStorage.setItem(INSTALLED_KEY, "true");
      } else {
        window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
      }
      setIsVisible(false);
      setDeferredPrompt(null);
      setShowInstructions(false);
    } finally {
      setIsInstalling(false);
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setDeferredPrompt(null);
    setShowInstructions(false);
    setIsVisible(false);
  }

  if (!isVisible) return null;

  // Safari (iOS/iPadOS/macOS) never fires beforeinstallprompt, so the only
  // honest UI there is the manual how-to; Chromium keeps the one-tap install.
  const showSteps = showInstructions && !deferredPrompt;

  return (
    <aside className="pwa-install-banner" aria-label="Install MyProdusen">
      <button type="button" className="pwa-install-close" onClick={dismiss} aria-label="Tutup popup install">
        <X size={18} aria-hidden="true" />
      </button>
      <div className="pwa-install-icon" aria-hidden="true">
        <Download size={22} />
      </div>
      <div className="pwa-install-copy">
        <h2>{guide.expectsInstallPrompt ? "Install MyProdusen" : "Pasang MyProdusen di Layar Utama"}</h2>
        <p>Akses absensi, KPI, payroll, dan laporan lebih cepat dari perangkat Anda.</p>
        {showSteps && (
          <ol className="pwa-install-steps" aria-label="Langkah pemasangan manual">
            {guide.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
      </div>
      <div className={showSteps ? "pwa-install-actions single" : "pwa-install-actions"}>
        {showSteps ? (
          <button type="button" className="btn btn-primary" onClick={dismiss}>
            Mengerti
          </button>
        ) : (
          <>
            <button type="button" className="btn btn-primary" onClick={installApp} disabled={isInstalling}>
              {isInstalling ? "Membuka..." : deferredPrompt ? "Install App" : guide.buttonLabel}
            </button>
            <button type="button" className="btn btn-secondary" onClick={dismiss}>
              Nanti
            </button>
          </>
        )}
      </div>
    </aside>
  );
}
