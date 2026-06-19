const os = require('node:os');

const localDevOrigins = Object.values(os.networkInterfaces())
  .flat()
  .filter((iface) => iface && iface.family === 'IPv4' && !iface.internal)
  .map((iface) => `${iface.address}:3000`);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    // Run `npm run lint` separately for type checking.
    ignoreBuildErrors: true,
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
    unoptimized: true,
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
      './node_modules/@swc/**',
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

module.exports = nextConfig;
