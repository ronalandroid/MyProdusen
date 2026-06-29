const os = require('node:os');

const localDevOrigins = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
  .map((iface) => `${iface.address}:3000`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false, // don't advertise the framework via X-Powered-By
  allowedDevOrigins: localDevOrigins,
  async headers() {
    const isProd = process.env.NODE_ENV === 'production';
    // Pragmatic CSP for a Next.js app that renders Leaflet/OSM map tiles,
    // inline styles, blob/data selfie previews, and same-origin SSE/fetch.
    // 'unsafe-inline'/'unsafe-eval' kept for Next's runtime + styled output;
    // tighten with nonces later if the inline surface is reduced.
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "worker-src 'self' blob:",
      "media-src 'self' blob: data:",
      "manifest-src 'self'",
      ...(isProd ? ['upgrade-insecure-requests'] : []),
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), geolocation=(self), microphone=(), payment=(), usb=()',
      },
      { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
      ...(isProd
        ? [
            {
              key: 'Strict-Transport-Security',
              value: 'max-age=63072000; includeSubDomains; preload',
            },
          ]
        : []),
    ];

    return [
      {
        // Apply baseline security headers to every response.
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/:path*.(png|jpg|jpeg|gif|webp|ico|svg|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/manifest.:ext(json|webmanifest)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/api/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/dashboard',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/dashboard/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
      {
        source: '/uploads',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, private' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
        ],
      },
    ];
  },
  typescript: {
    // Type errors fail the build. `npm run lint` (tsc --noEmit) also runs in CI
    // as a faster pre-build gate, but the production build is the final guard.
    ignoreBuildErrors: false,
  },

  // Avoid double render during local dev; keep strict mode in production.
  reactStrictMode: process.env.NODE_ENV === 'production',

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        // Allow local network IP for mobile device preview (e.g. 192.168.x.x)
        protocol: 'http',
        hostname: '192.168.*.*',
      },
      {
        protocol: 'https',
        hostname: 'myprodusen.online',
      },
      {
        protocol: 'https',
        hostname: '*.myprodusen.online',
      },
    ],
    // No Next static export here (output: 'standalone'); the Capacitor app
    // loads the live server, not an exported bundle — so the on-demand image
    // optimizer is safe to run on the standalone server (needs sharp, a
    // declared dependency). Default ON; set IMAGE_OPTIMIZATION_DISABLED=true to
    // instantly roll back without a code change if the runtime lacks sharp.
    unoptimized: process.env.IMAGE_OPTIMIZATION_DISABLED === 'true',
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
      allowedOrigins: [
        'localhost:3000',
        'myprodusen.online',
        'https://myprodusen.online',
        // Local network strings for mobile device preview (add your IP if different)
        '192.168.1.1:3000',
        '192.168.1.2:3000',
        '192.168.1.3:3000',
        '192.168.1.4:3000',
        '192.168.1.5:3000',
        '192.168.0.1:3000',
        '192.168.0.100:3000',
        '10.0.0.1:3000',
        '10.0.0.2:3000',
        '10.0.0.3:3000',
      ],
    },
    cpus: Number(process.env.NEXT_BUILD_CPUS || '1'),
  },

  outputFileTracingExcludes: {
    '*': [
      // Repo artifacts
      './docs/**',
      './tests/**',
      './coverage/**',
      './public/uploads/**',
      './drizzle/**/*.bak',
      './tmp/**',
      // Build-time-only node_modules (not needed in standalone runtime)
      './node_modules/typescript/**',
      './node_modules/@types/**',
      './node_modules/eslint/**',
      './node_modules/@eslint/**',
      './node_modules/eslint-*/**',
      './node_modules/prettier/**',
      './node_modules/tailwindcss/**',
      './node_modules/@tailwindcss/**',
      './node_modules/postcss/**',
      './node_modules/autoprefixer/**',
      './node_modules/drizzle-kit/**',
      './node_modules/vitest/**',
      './node_modules/@vitest/**',
      './node_modules/husky/**',
      './node_modules/lint-staged/**',
      './node_modules/@playwright/**',
      './node_modules/playwright/**',
      './node_modules/playwright-core/**',
      './node_modules/webpack/**',
      './node_modules/webpack-*/**',
      './node_modules/next/dist/compiled/webpack/**',
      './node_modules/next/dist/compiled/terser/**',
      './node_modules/next/dist/compiled/babel/**',
      './node_modules/esbuild/**',
      './node_modules/@esbuild/**',
      './node_modules/rollup/**',
      './node_modules/vite/**',
      './node_modules/tsx/**',
      './node_modules/ts-node/**',
      './node_modules/ts-morph/**',
    ],
  },

  turbopack: {
    root: __dirname,
  },

  trailingSlash: false,
};

// Wrap with Sentry only when a DSN is configured, so builds without Sentry
// (local/dev, or before the env is set) stay untouched and fast. Source-map
// upload is skipped unless SENTRY_AUTH_TOKEN is present — runtime error
// capture works with just the DSN.
const sentryDsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN;

if (sentryDsn) {
  const { withSentryConfig } = require('@sentry/nextjs');
  module.exports = withSentryConfig(nextConfig, {
    org: process.env.SENTRY_ORG || 'umbrella-corp-m4',
    project: process.env.SENTRY_PROJECT || 'javascript-nextjs',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    silent: !process.env.CI,
    // Don't fail the build if Sentry's plugin hits an error (e.g. no auth token).
    errorHandler: () => {},
    // Tunnel browser events through our origin to dodge ad-blockers.
    tunnelRoute: '/monitoring',
    // Shrink the client SDK shipped to every visitor. We only use Sentry for
    // error reporting — Session Replay is never enabled, and client perf
    // tracing was sampled at just 0.05 — so strip both plus debug logging.
    // Error capture (the actual value) is unaffected.
    bundleSizeOptimizations: {
      excludeDebugStatements: true,
      excludeReplayShadowDom: true,
      excludeReplayIframe: true,
      excludeReplayWorker: true,
      excludeReplayCanvas: true,
      excludeTracing: true,
    },
    sourcemaps: {
      disable: !process.env.SENTRY_AUTH_TOKEN,
    },
  });
} else {
  module.exports = nextConfig;
}
