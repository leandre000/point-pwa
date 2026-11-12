import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kiraka/ui', '@kiraka/contracts'],
  async rewrites() {
    const apiTarget = process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3001';
    return [
      {
        source: '/api/v1/:path*',
        destination: `${apiTarget}/api/v1/:path*`,
      },
    ];
  },
  webpack: (config, { dev }) => {
    config.resolve = config.resolve || {};
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    };
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default nextConfig;

