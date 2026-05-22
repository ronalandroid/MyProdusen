const baseUrl = (process.env.BASE_URL || 'https://myprodusen.online').replace(/\/$/, '');

const secretPattern = /DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|RESEND_API_KEY|SUPERADMIN_PASSWORD|postgresql:\/\//i;

async function request(path, init = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    redirect: 'manual',
    cache: 'no-store',
    ...init,
    headers: {
      'User-Agent': 'MyProdusen-CDN-Verify/1.0',
      Accept: '*/*',
      ...(init.headers || {}),
    },
  });
  const text = init.method === 'HEAD' ? '' : await response.clone().text().catch(() => '');
  return {
    path,
    status: response.status,
    headers: response.headers,
    body: text,
    cacheControl: response.headers.get('cache-control') || '',
    cfCacheStatus: response.headers.get('cf-cache-status') || '',
    location: response.headers.get('location') || '',
  };
}

function assertNoSecret(result) {
  const headerDump = [...result.headers.entries()].map(([key, value]) => `${key}: ${value}`).join('\n');
  if (secretPattern.test(headerDump) || secretPattern.test(result.body)) {
    throw new Error(`${result.path} leaked secret-looking content`);
  }
}

function assertNotHit(result) {
  if (result.cfCacheStatus.toUpperCase() === 'HIT') {
    throw new Error(`${result.path} must not be Cloudflare HIT`);
  }
}

function assertNoStore(result) {
  if (!/no-store/i.test(result.cacheControl) || !/private/i.test(result.cacheControl)) {
    throw new Error(`${result.path} expected Cache-Control no-store, private; got ${result.cacheControl || '(missing)'}`);
  }
}

function assertStaticCacheable(result) {
  if (!/public/i.test(result.cacheControl) || !/max-age/i.test(result.cacheControl)) {
    throw new Error(`${result.path} expected public max-age cache; got ${result.cacheControl || '(missing)'}`);
  }
}

async function checkStaticLogo() {
  const result = await request('/logo-fast.webp', { method: 'HEAD' });
  if (result.status !== 200) {
    throw new Error(`/logo-fast.webp expected 200, got ${result.status}`);
  }
  assertStaticCacheable(result);
  assertNoSecret(result);
  return result;
}

async function checkHealth() {
  const result = await request('/api/health', { method: 'GET' });
  if (result.status !== 200) {
    throw new Error(`/api/health expected 200, got ${result.status}`);
  }
  assertNoStore(result);
  assertNotHit(result);
  assertNoSecret(result);
  return result;
}

async function checkDashboard() {
  const result = await request('/dashboard', { method: 'HEAD' });
  if (![307, 308, 302].includes(result.status)) {
    throw new Error(`/dashboard unauth expected redirect to login, got ${result.status}`);
  }
  if (!result.location.includes('/login')) {
    throw new Error(`/dashboard redirect expected /login, got ${result.location || '(missing)'}`);
  }
  assertNoStore(result);
  assertNotHit(result);
  assertNoSecret(result);
  return result;
}

async function checkPdfUnauth() {
  const result = await request('/api/reports/pdf', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportType: 'attendance_summary' }),
  });
  if (![401, 403].includes(result.status)) {
    throw new Error(`/api/reports/pdf unauth expected 401/403, got ${result.status}. Body: ${result.body}`);
  }
  assertNoStore(result);
  assertNotHit(result);
  assertNoSecret(result);
  return result;
}

async function checkProtectedApiHead(path) {
  const result = await request(path, { method: 'HEAD' });
  assertNoStore(result);
  assertNotHit(result);
  assertNoSecret(result);
  return result;
}

const checks = [
  ['static logo', checkStaticLogo],
  ['health no-store', checkHealth],
  ['dashboard redirect no-store', checkDashboard],
  ['reports PDF unauth no-store', checkPdfUnauth],
  ['payroll API no-store', () => checkProtectedApiHead('/api/payroll')],
  ['attendance API no-store', () => checkProtectedApiHead('/api/attendance/today')],
];

console.log(`Verifying CDN cache policy at ${baseUrl}`);

try {
  for (const [name, check] of checks) {
    const result = await check();
    console.log(`PASS ${name}`, {
      path: result.path,
      status: result.status,
      cacheControl: result.cacheControl,
      cfCacheStatus: result.cfCacheStatus || '(none)',
      location: result.location || undefined,
    });
  }
  console.log('CDN cache verification passed.');
} catch (error) {
  console.error('CDN cache verification failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
