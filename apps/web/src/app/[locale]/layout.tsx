import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NavigationShell } from '@/components/NavigationShell';
import '@kiraka/ui/globals.css';

export const metadata: Metadata = {
  title: 'KIRAKA — Find help. Discover opportunity.',
  description: 'A Rwanda-first local services and opportunities marketplace.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'KIRAKA',
  },
};

export const viewport: Viewport = {
  themeColor: '#205641',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/icons/icon-192.svg" />
      </head>
      <body className="antialiased min-h-screen bg-[var(--color-bg)] text-[var(--color-text)] flex flex-col">
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            <NavigationShell>{children}</NavigationShell>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
