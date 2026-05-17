/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
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
    cpus: 1,
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
