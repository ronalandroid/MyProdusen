import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const serviceWorker = readFileSync('public/sw.js', 'utf8');
const registration = readFileSync('src/components/pwa/ServiceWorkerRegistration.tsx', 'utf8');
const prompt = readFileSync('src/components/pwa/PwaInstallPrompt.tsx', 'utf8');
const layout = readFileSync('app/layout.tsx', 'utf8');

describe('PWA service worker and install prompt source', () => {
  it('does not register a no-op fetch handler or cache private routes', () => {
    expect(serviceWorker).not.toMatch(/addEventListener\(['"]fetch/);
    expect(serviceWorker).not.toContain('caches.open');
    expect(serviceWorker).not.toContain('/api/');
    expect(serviceWorker).not.toContain('/dashboard');
    expect(serviceWorker).not.toContain('/uploads');
  });

  it('registers service worker once in production without inline script', () => {
    expect(registration).toContain('process.env.NODE_ENV !== "production"');
    expect(registration).toContain('navigator.serviceWorker.getRegistration("/")');
    expect(registration).toContain('navigator.serviceWorker.register("/sw.js", { scope: "/" })');
    expect(layout).toContain('<ServiceWorkerRegistration />');
    expect(layout).not.toContain('dangerouslySetInnerHTML');
  });

  it('uses deferred beforeinstallprompt flow with dismiss cooldown', () => {
    expect(prompt).toContain('event.preventDefault()');
    expect(prompt).toContain('setDeferredPrompt(event as BeforeInstallPromptEvent)');
    expect(prompt).toContain('await deferredPrompt.prompt()');
    expect(prompt).toContain('await deferredPrompt.userChoice');
    expect(prompt).toContain('DISMISS_MS = 7 * 24 * 60 * 60 * 1000');
    expect(prompt).toContain('Install App');
    expect(prompt).toContain('Nanti');
  });
});
