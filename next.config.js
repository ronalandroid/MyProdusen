/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimize for development and reduce CPU usage on MacBook M1
  typescript: {
    // Skip type checking during build for faster development
    // Run `npm run lint` separately for type checking
    ignoreBuildErrors: true,
  },

  // Disable React Strict Mode in development to prevent double rendering
  reactStrictMode: process.env.NODE_ENV === 'production',

  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: '*.netlify.app',
      },
    ],
    // Required for Netlify
    unoptimized: true,
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Reduce CPU usage in development
    cpus: 2,
  },

  // Optimize webpack file watching to reduce CPU usage
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/.next/**',
          '**/docs/**',
          '**/tests/**',
          '**/public/uploads/**',
        ],
      };
    }
    return config;
  },

  trailingSlash: false,
};

module.exports = nextConfig;
