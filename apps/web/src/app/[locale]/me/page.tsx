'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/routing';
import { TopAppBar, Card, Avatar, Button } from '@kiraka/ui';
import { useTheme } from '@/components/ThemeProvider';
import {
  User,
  Wrench,
  Bell,
  Globe,
  SunMoon,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
} from 'lucide-react';

export default function MePage() {
  const t = useTranslations('me');
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: 'en' | 'rw' | 'fr') => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar title={t('title')} />

      <div className="p-4 max-w-xl mx-auto w-full space-y-4">
        {/* User Card */}
        <Card className="p-4 flex items-center gap-4">
          <Avatar name="Guest User" size="lg" />
          <div className="flex-1 overflow-hidden">
            <h2 className="text-[18px] font-bold text-[var(--color-text)] truncate">
              Guest User
            </h2>
            <p className="text-[14px] text-[var(--color-text-secondary)] truncate">
              Remera, Kigali · Kigali Pilot
            </p>
          </div>
        </Card>

        {/* Settings Sections */}
        <div className="space-y-2">
          {/* Appearance / Theme Toggle */}
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <SunMoon className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <h3 className="font-semibold text-[14px] text-[var(--color-text)]">
                  {t('theme')}
                </h3>
                <p className="text-[12px] text-[var(--color-text-tertiary)] capitalize">
                  {theme} mode
                </p>
              </div>
            </div>

            <div className="flex rounded-[var(--radius-control)] bg-[var(--color-surface-2)] p-1 border border-[var(--color-border)]">
              {(['light', 'dark', 'system'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setTheme(m)}
                  className={`px-2.5 py-1 text-[12px] font-medium rounded capitalize ${
                    theme === m
                      ? 'bg-[var(--color-surface)] text-[var(--color-primary)] shadow-sm'
                      : 'text-[var(--color-text-secondary)]'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </Card>

          {/* Language Switcher */}
          <Card className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-[var(--color-primary)]" />
              <div>
                <h3 className="font-semibold text-[14px] text-[var(--color-text)]">
                  {t('language')}
                </h3>
                <p className="text-[12px] text-[var(--color-text-tertiary)]">
                  English · Kinyarwanda · Français
                </p>
              </div>
            </div>

            <div className="flex rounded-[var(--radius-control)] bg-[var(--color-surface-2)] p-1 border border-[var(--color-border)]">
              {[
                { code: 'en', label: 'EN' },
                { code: 'rw', label: 'RW' },
                { code: 'fr', label: 'FR' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code as any)}
                  className="px-2.5 py-1 text-[12px] font-medium rounded hover:bg-[var(--color-surface)] text-[var(--color-text)]"
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </Card>

          {/* Links */}
          {[
            { icon: User, title: t('profile') },
            { icon: Wrench, title: t('providerTools') },
            { icon: Bell, title: t('notifications') },
            { icon: Shield, title: t('privacy') },
            { icon: HelpCircle, title: t('help') },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <Card
                key={idx}
                interactive
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-5 w-5 text-[var(--color-primary)]" />
                  <span className="font-semibold text-[14px] text-[var(--color-text)]">
                    {item.title}
                  </span>
                </div>
                <ChevronRight className="h-4 w-4 text-[var(--color-text-tertiary)]" />
              </Card>
            );
          })}
        </div>

        {/* App Version Info */}
        <div className="pt-4 text-center">
          <p className="text-[12px] text-[var(--color-text-tertiary)]">
            KIRAKA PWA v0.1.0 (MVP Foundation M0) · Kigali, Rwanda
          </p>
        </div>
      </div>
    </div>
  );
}
