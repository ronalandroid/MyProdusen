import { describe, it, expect } from 'vitest';
import {
  successResponse,
  errorResponse,
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  validationErrorResponse,
} from './response';

describe('response helpers', () => {
  it('successResponse wraps data and sets no-store headers', async () => {
    const res = successResponse({ a: 1 }, 'ok');
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('no-store, private');
    expect(await res.json()).toEqual({ success: true, data: { a: 1 }, message: 'ok' });
  });

  it('errorResponse sets the status and mirrors the message', async () => {
    const res = errorResponse('boom', 400);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error).toBe('boom');
    expect(body.message).toBe('boom');
  });

  it('maps the named helper statuses', () => {
    expect(unauthorizedResponse().status).toBe(401);
    expect(forbiddenResponse().status).toBe(403);
    expect(notFoundResponse().status).toBe(404);
    expect(validationErrorResponse('bad').status).toBe(422);
  });
});
