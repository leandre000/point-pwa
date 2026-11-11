import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing.js';

export default createMiddleware(routing);

export const config = {
  // Match all paths except internal next.js files, api, and public static assets
  matcher: ['/((?!api|_next|_vercel|icons|fonts|.*\\..*).*)'],
};
