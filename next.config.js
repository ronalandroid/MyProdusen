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
        'myprodusen.online',
        'https://myprodusen.online',
      ],
    },
    cpus: 2,
  },

  turbopack: {
    root: __dirname,
  },

  trailingSlash: false,
};

module.exports = nextConfig;
