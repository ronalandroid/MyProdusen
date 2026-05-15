/** @type {import('next').NextConfig} */
const nextConfig = {
  // Remove standalone output for Netlify
  // output: 'standalone',
  typescript: {
    ignoreBuildErrors: false, // Enable type checking for production
  },
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
    unoptimized: true, // Required for Netlify
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  // Netlify-specific settings
  trailingSlash: false,
  reactStrictMode: true,
};

module.exports = nextConfig;
