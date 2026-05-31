import type { Page } from '@playwright/test';

export async function authCookieHeader(page: Page) {
  const cookies = await page.context().cookies();
  const authCookies = cookies.filter((cookie) => ['myprodusen_token', 'token', 'auth', 'jwt'].includes(cookie.name));
  return authCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');
}
