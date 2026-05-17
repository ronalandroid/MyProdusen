import { describe, expect, it } from 'vitest';
import { NextResponse } from 'next/server';
import { withApiHandler } from '@/lib/core/route-handler';
import { TOKEN_COOKIE_NAME } from '@/lib/auth-response';

describe('withApiHandler CSRF guard', () => {
  it('rejects cross-site cookie-auth mutating requests', async () => {
    const handler = withApiHandler(async () => NextResponse.json({ success: true }));
    const request = new Request('https://myprodusen.online/api/leave', {
      method: 'POST',
      headers: {
        cookie: `${TOKEN_COOKIE_NAME}=abc`,
        origin: 'https://evil.example',
      },
    });

    const response = await handler(request as any, undefined as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('allows bearer-token API clients without browser origin', async () => {
    const handler = withApiHandler(async () => NextResponse.json({ success: true }));
    const request = new Request('https://myprodusen.online/api/leave', {
      method: 'POST',
      headers: {
        authorization: 'Bearer test-token',
      },
    });

    const response = await handler(request as any, undefined as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
