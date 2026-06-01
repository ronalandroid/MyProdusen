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
    return [
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
      './docs/**',
      './tests/**',
      './coverage/**',
      './public/uploads/**',
      './drizzle/**/*.bak',
      './tmp/**',
    ],
  },

  turbopack: {
    root: __dirname,
  },

  trailingSlash: false,
};

module.exports = nextConfig;
