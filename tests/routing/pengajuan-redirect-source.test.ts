import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';

const routePath = 'app/pengajuan/page.tsx';

describe('/pengajuan legacy route', () => {
  it('redirects to leave dashboard instead of rendering 404', () => {
    expect(existsSync(routePath)).toBe(true);
    const source = readFileSync(routePath, 'utf8');
    expect(source).toContain("redirect('/dashboard/leave')");
  });
});
