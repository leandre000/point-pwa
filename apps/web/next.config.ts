import createNextIntlPlugin from 'next-intl/plugin';
import withSerwistInit from '@serwist/next';
import type { NextConfig } from 'next';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const withSerwist = withSerwistInit({
  swSrc: 'src/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV === 'development',
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@kiraka/ui', '@kiraka/contracts'],
  experimental: {
    // Next 15 optimizations
  },
};

export default withSerwist(withNextIntl(nextConfig));
