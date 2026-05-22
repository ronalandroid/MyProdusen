import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import nextConfig from '../../next.config.js';
import { getClientIp } from '@/lib/middleware';
import { readFileSync } from 'node:fs';

function makeRequest(headers: Record<string, string>) {
  return new NextRequest('https://myprodusen.online/api/auth/login', { headers });
}

describe('Cloudflare proxy and CDN cache policy', () => {
  it('prefers Cloudflare client IP only when Cloudflare trace headers exist', () => {
    expect(getClientIp(makeRequest({
      'cf-connecting-ip': '198.51.100.10',
      'cf-ray': 'abc123-CGK',
      'x-forwarded-for': '10.0.0.1',
    }))).toBe('198.51.100.10');

    expect(getClientIp(makeRequest({
      'cf-connecting-ip': '198.51.100.10',
      'x-forwarded-for': '203.0.113.20, 10.0.0.1',
    }))).toBe('203.0.113.20');
  });

  it('declares no-store headers for protected CDN paths', async () => {
    const headers = await nextConfig.headers();
    const protectedSources = new Map(headers.map((entry: any) => [entry.source, entry.headers]));

    for (const source of ['/api/:path*', '/dashboard', '/dashboard/:path*', '/uploads', '/uploads/:path*']) {
      const routeHeaders = protectedSources.get(source) as Array<{ key: string; value: string }> | undefined;
      expect(routeHeaders, `${source} headers`).toBeTruthy();
      expect(routeHeaders).toEqual(expect.arrayContaining([
        { key: 'Cache-Control', value: 'no-store, private' },
        { key: 'Pragma', value: 'no-cache' },
        { key: 'Expires', value: '0' },
      ]));
    }
  });

  it('keeps service worker free of private route caching', () => {
    const serviceWorker = readFileSync('public/sw.js', 'utf8');
    expect(serviceWorker).not.toMatch(/addEventListener\(['"]fetch/);
    expect(serviceWorker).not.toContain('caches.open');
    expect(serviceWorker).not.toContain('/api/');
    expect(serviceWorker).not.toContain('/dashboard');
    expect(serviceWorker).not.toContain('/uploads');
  });

  it('ships CDN verification script and package command', () => {
    const script = readFileSync('scripts/verify-cdn-cache.mjs', 'utf8');
    const packageJson = readFileSync('package.json', 'utf8');
    expect(script).toContain('/api/health');
    expect(script).toContain('/dashboard');
    expect(script).toContain('/api/reports/pdf');
    expect(script).toContain('cf-cache-status');
    expect(script).toContain('no-store');
    expect(packageJson).toContain('"verify:cdn": "node scripts/verify-cdn-cache.mjs"');
  });
});
