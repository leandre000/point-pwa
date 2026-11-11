import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import { Serwist, StaleWhileRevalidate, NetworkFirst, CacheFirst } from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: false, // Safe skip-waiting flow: only activate when user confirms via update toast
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    // Static assets: fonts, icons, images
    {
      matcher: /\.(?:png|jpg|jpeg|svg|webp|avif|woff2|woff|ttf)$/i,
      handler: new CacheFirst({
        cacheName: 'kiraka-static-assets',
      }),
    },
    // Safe public read APIs
    {
      matcher: /\/api\/v1\/(categories|areas|providers\/public)/i,
      handler: new StaleWhileRevalidate({
        cacheName: 'kiraka-public-api',
      }),
    },
    // Dynamic API reads: NetworkFirst with timeout fallback
    {
      matcher: /\/api\/v1\/(jobs|offers)/i,
      handler: new NetworkFirst({
        cacheName: 'kiraka-dynamic-api',
        networkTimeoutSeconds: 3,
      }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: '/offline',
        matcher({ request }) {
          return request.destination === 'document';
        },
      },
    ],
  },
});

serwist.addEventListeners();

