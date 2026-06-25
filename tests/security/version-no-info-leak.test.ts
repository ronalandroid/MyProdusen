import { describe, it, expect } from 'vitest';
import { GET } from '@/app/api/version/route';

/**
 * Security guard (audit M6): the public, unauthenticated /api/version endpoint
 * must not expose infrastructure reconnaissance — nodeEnv, git commit, or build
 * time. It returns only a benign liveness + version signal.
 */
describe('/api/version info-leak guard', () => {
  it('does not expose nodeEnv / gitCommitSha / buildTime', async () => {
    const res = await GET();
    const body = await res.json();

    expect(body.status).toBe('ok');
    expect(body.appName).toBe('MyProdusen');
    expect(body).not.toHaveProperty('nodeEnv');
    expect(body).not.toHaveProperty('gitCommitSha');
    expect(body).not.toHaveProperty('buildTime');
  });
});
