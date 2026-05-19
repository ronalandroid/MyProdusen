"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let isCancelled = false;

    const register = async () => {
      try {
        const existing = await navigator.serviceWorker.getRegistration("/");
        if (isCancelled || existing?.active?.scriptURL.endsWith("/sw.js")) return;
        await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      } catch {
        // PWA is optional. Never block login, attendance, or dashboard navigation.
      }
    };

    if (document.readyState === "complete") {
      void register();
    } else {
      window.addEventListener("load", register, { once: true });
    }

    return () => {
      isCancelled = true;
      window.removeEventListener("load", register);
    };
  }, []);

  return null;
}
