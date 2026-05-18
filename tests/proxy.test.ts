import { describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy } from '../proxy';

function makeRequest(pathname: string, token?: string) {
  const request = new NextRequest(`https://myprodusen.test${pathname}`);
  if (token) {
    request.cookies.set('myprodusen_token', token);
  }
  return request;
}

describe('Next proxy route guard', () => {
  it('redirects unauthenticated dashboard access to login with redirect target', () => {
    const response = proxy(makeRequest('/dashboard/attendance'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://myprodusen.test/login?redirect=%2Fdashboard%2Fattendance');
  });

  it('redirects authenticated users away from auth pages', () => {
    const response = proxy(makeRequest('/register', 'valid-token'));

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe('https://myprodusen.test/dashboard');
  });
});
