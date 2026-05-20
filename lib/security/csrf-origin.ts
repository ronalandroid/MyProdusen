const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface OriginCheckInput {
  method: string;
  requestUrl: string;
  origin?: string | null;
  referer?: string | null;
  appUrl?: string | null;
}

function toOrigin(value?: string | null) {
  if (!value) return null;

  try {
    return new URL(value).origin;
  } catch (_error) {
    return null;
  }
}

export function isTrustedMutationOrigin(input: OriginCheckInput) {
  if (!MUTATING_METHODS.has(input.method.toUpperCase())) {
    return true;
  }

  if (process.env.TESTSPRITE_DISABLE_CSRF_ORIGIN === 'true' || process.env.E2E_DISABLE_CSRF_ORIGIN === 'true') {
    return true;
  }

  const requestOrigin = toOrigin(input.requestUrl);
  const configuredOrigin = toOrigin(input.appUrl || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL);
  const submittedOrigin = toOrigin(input.origin) || toOrigin(input.referer);
  const allowedOrigins = new Set([requestOrigin, configuredOrigin].filter(Boolean));

  if (!submittedOrigin || allowedOrigins.size === 0) {
    return false;
  }

  return allowedOrigins.has(submittedOrigin);
}
