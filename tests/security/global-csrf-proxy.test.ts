import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '@/proxy';
import { TOKEN_COOKIE_NAME } from '@/lib/auth-response';

describe('global API CSRF middleware', () => {
  it('rejects cross-site cookie-authenticated mutations', async () => {
    const request = new NextRequest('https://myprodusen.online/api/leave', {
      method: 'POST',
      headers: {
        cookie: `${TOKEN_COOKIE_NAME}=abc`,
        origin: 'https://evil.example',
      },
    });

    const response = proxy(request);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.success).toBe(false);
  });

  it('allows bearer-token mutations without browser origin', () => {
    const request = new NextRequest('https://myprodusen.online/api/leave', {
      method: 'POST',
      headers: {
        authorization: 'Bearer token',
      },
    });

    const response = proxy(request);

    expect(response.status).toBe(200);
  });
});
