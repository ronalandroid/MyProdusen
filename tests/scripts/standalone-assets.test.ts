import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('standalone build assets', () => {
  it('copies Next static and public assets for standalone server', () => {
    const source = readFileSync('scripts/build-next-with-heartbeat.mjs', 'utf8');
    expect(source).toContain(".next/standalone/.next/static");
    expect(source).toContain(".next/standalone/public");
  });
});
