const baseUrl = (process.env.BASE_URL || 'https://myprodusen.online').replace(/\/$/, '');

async function readBody(response) {
  const text = await response.text();
  return text.length > 500 ? `${text.slice(0, 500)}...` : text;
}

async function checkHealth() {
  const response = await fetch(`${baseUrl}/api/health`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  const body = await readBody(response);

  if (response.status !== 200) {
    throw new Error(`GET /api/health expected 200, got ${response.status}. Body: ${body}`);
  }

  if (/DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\//i.test(body)) {
    throw new Error('GET /api/health leaked secret-looking content');
  }

  let parsed = null;
  try {
    parsed = JSON.parse(body);
  } catch {
    throw new Error(`GET /api/health did not return JSON. Body: ${body}`);
  }

  if (parsed.status !== 'ok') {
    throw new Error(`GET /api/health expected status ok, got ${parsed.status}`);
  }

  return parsed;
}

async function checkPdfRoute() {
  const response = await fetch(`${baseUrl}/api/reports/pdf`, {
    method: 'POST',
    headers: {
      Accept: 'application/json, application/pdf',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ reportType: 'attendance_summary' }),
    cache: 'no-store',
  });
  const body = await readBody(response);

  if (response.status === 404) {
    throw new Error('POST /api/reports/pdf returned 404. Live image is stale or route is missing from deployed build.');
  }

  if (![401, 403].includes(response.status)) {
    throw new Error(`POST /api/reports/pdf unauthenticated expected 401/403, got ${response.status}. Body: ${body}`);
  }

  if (/selfie|attendance-selfies|DATABASE_URL|JWT_SECRET|NEXTAUTH_SECRET|postgresql:\/\//i.test(body)) {
    throw new Error('POST /api/reports/pdf unauthenticated response leaked sensitive-looking content');
  }

  return { status: response.status };
}

try {
  console.log(`Verifying live routes at ${baseUrl}`);
  const health = await checkHealth();
  console.log('PASS GET /api/health', {
    status: health.status,
    app: health.app?.name,
    version: health.app?.version,
    commit: health.app?.commit,
    buildTime: health.app?.buildTime,
    nodeEnv: health.app?.nodeEnv,
  });

  const pdf = await checkPdfRoute();
  console.log('PASS POST /api/reports/pdf unauthenticated protected', pdf);
  console.log('Live route verification passed.');
} catch (error) {
  console.error('Live route verification failed.');
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}
