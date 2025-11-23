/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // For Turbopack (Next.js 16+), externalize Bull queue library
  // Bull uses dynamic imports and worker processes that don't work with bundling
  serverExternalPackages: ['bull'],
  // Add empty turbopack config to silence the warning
  turbopack: {},
  // Enable standalone output for Docker
  output: 'standalone',
};

module.exports = nextConfig;

