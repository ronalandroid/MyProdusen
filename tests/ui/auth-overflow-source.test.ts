import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('auth mobile overflow guard', () => {
  it('clips auth decorative overflow at page level', () => {
    const css = readFileSync('app/globals.css', 'utf8');
    const authPageBlock = css.match(/\.auth-page\s*\{[\s\S]*?\}/)?.[0] ?? '';
    expect(authPageBlock).toContain('overflow-x: clip');
    expect(authPageBlock).toContain('max-width: 100vw');
    expect(authPageBlock).toContain('box-sizing: border-box');
  });
});
