export function getCanonicalAppUrl(fallback = 'http://localhost:3000') {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || fallback).replace(/\/$/, '');
}
