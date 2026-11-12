import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: true, // Keep disabled in dev to avoid service worker conflicts
});

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
    // Disable disk pack cache on Windows dev to prevent 0.pack.gz file lock corruption
    if (dev) {
      config.cache = false;
    }
    return config;
  },
};

export default withSerwist(withNextIntl(nextConfig));
