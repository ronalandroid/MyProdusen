import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const STATIC_ASSETS = new Set([
  '/favicon.ico',
  '/favicon-16.png',
  '/favicon-32.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
  '/manifest.json',
  '/manifest.webmanifest',
]);

function walk(dir: string, predicate: (file: string) => boolean, files: string[] = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!['node_modules', '.next'].includes(entry.name)) {
        walk(file, predicate, files);
      }
    } else if (predicate(file)) {
      files.push(file);
    }
  }
  return files;
}

function pageRouteFromFile(file: string) {
  const route = file
    .replace(/^app\//, '/')
    .replace(/\/page\.tsx$/, '')
    .replace(/\([^)]*\)\//g, '')
    .replace(/\[([^\]]+)\]/g, ':$1');

  return route === '' ? '/' : route;
}

describe('static dashboard links', () => {
  it('does not link to missing static pages', () => {
    const pages = new Set(walk('app', (file) => file.endsWith('/page.tsx')).map(pageRouteFromFile));
    const sourceFiles = [
      ...walk('app', (file) => /\.(tsx|ts)$/.test(file)),
      ...walk('components', (file) => /\.(tsx|ts)$/.test(file)),
      ...walk('lib', (file) => /\.(tsx|ts)$/.test(file)),
    ];
    const missing: string[] = [];

    for (const file of sourceFiles) {
      const source = fs.readFileSync(file, 'utf8');
      const linkPattern = /(?:href=|router\.push\(|window\.location\.href\s*=\s*)[\{]?["']([^"'#?]+)["']/g;
      let match: RegExpExecArray | null;

      while ((match = linkPattern.exec(source))) {
        const href = match[1];
        if (!href.startsWith('/') || href.startsWith('/api') || STATIC_ASSETS.has(href)) {
          continue;
        }
        if (href.includes('${') || href.includes(':')) {
          continue;
        }
        if (!pages.has(href)) {
          missing.push(`${file} -> ${href}`);
        }
      }
    }

    expect(missing).toEqual([]);
  });
});
