import { describe, expect, it } from 'vitest';
import { resolveInstallGuide } from '@/src/components/pwa/install-platform';

const UA = {
  iphoneSafari:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  iphoneChrome:
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/125.0.6422.80 Mobile/15E148 Safari/604.1',
  ipadLegacy:
    'Mozilla/5.0 (iPad; CPU OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1',
  // iPadOS 13+ masquerades as desktop macOS; only maxTouchPoints reveals it.
  ipadMasquerade:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  macSafari:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  macChrome:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  androidChrome:
    'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.6478.71 Mobile Safari/537.36',
  windowsChrome:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  windowsEdge:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.68',
};

describe('resolveInstallGuide', () => {
  it('detects iPhone Safari as ios without native install prompt', () => {
    const guide = resolveInstallGuide({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 });

    expect(guide.platform).toBe('ios');
    expect(guide.expectsInstallPrompt).toBe(false);
    expect(guide.steps.join(' ')).toMatch(/Bagikan/i);
    expect(guide.steps.join(' ')).toMatch(/Layar Utama/i);
  });

  it('treats Chrome on iPhone (CriOS) as ios — every iOS browser installs via the Share menu', () => {
    const guide = resolveInstallGuide({ userAgent: UA.iphoneChrome, maxTouchPoints: 5 });

    expect(guide.platform).toBe('ios');
    expect(guide.expectsInstallPrompt).toBe(false);
  });

  it('detects a legacy iPad user agent as ios', () => {
    const guide = resolveInstallGuide({ userAgent: UA.ipadLegacy, maxTouchPoints: 5 });

    expect(guide.platform).toBe('ios');
    expect(guide.expectsInstallPrompt).toBe(false);
  });

  it('unmasks iPadOS pretending to be macOS via touch support', () => {
    const guide = resolveInstallGuide({ userAgent: UA.ipadMasquerade, maxTouchPoints: 5 });

    expect(guide.platform).toBe('ios');
    expect(guide.expectsInstallPrompt).toBe(false);
    expect(guide.steps.join(' ')).toMatch(/Layar Utama/i);
  });

  it('detects real macOS Safari (no touch) and points to Add to Dock', () => {
    const guide = resolveInstallGuide({ userAgent: UA.macSafari, maxTouchPoints: 0 });

    expect(guide.platform).toBe('macos-safari');
    expect(guide.expectsInstallPrompt).toBe(false);
    expect(guide.steps.join(' ')).toMatch(/Add to Dock/i);
  });

  it('keeps Chrome on macOS on the native install prompt path', () => {
    const guide = resolveInstallGuide({ userAgent: UA.macChrome, maxTouchPoints: 0 });

    expect(guide.platform).toBe('other');
    expect(guide.expectsInstallPrompt).toBe(true);
    expect(guide.buttonLabel).toBe('Install App');
  });

  it('detects Android Chrome with native prompt support and menu fallback steps', () => {
    const guide = resolveInstallGuide({ userAgent: UA.androidChrome, maxTouchPoints: 5 });

    expect(guide.platform).toBe('android');
    expect(guide.expectsInstallPrompt).toBe(true);
    expect(guide.buttonLabel).toBe('Install App');
    expect(guide.steps.join(' ')).toMatch(/layar utama/i);
  });

  it('defaults desktop Chromium (Windows Chrome/Edge) to the native prompt path', () => {
    for (const ua of [UA.windowsChrome, UA.windowsEdge]) {
      const guide = resolveInstallGuide({ userAgent: ua, maxTouchPoints: 0 });

      expect(guide.platform).toBe('other');
      expect(guide.expectsInstallPrompt).toBe(true);
    }
  });

  it('labels the primary action as a how-to when no prompt can ever arrive', () => {
    const guide = resolveInstallGuide({ userAgent: UA.iphoneSafari, maxTouchPoints: 5 });

    expect(guide.buttonLabel).toBe('Lihat Caranya');
  });

  it('handles missing data defensively (SSR) as generic guidance', () => {
    const guide = resolveInstallGuide({ userAgent: '', maxTouchPoints: 0 });

    expect(guide.platform).toBe('other');
    expect(guide.expectsInstallPrompt).toBe(true);
    expect(guide.steps.length).toBeGreaterThan(0);
  });
});
