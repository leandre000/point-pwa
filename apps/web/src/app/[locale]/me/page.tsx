'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter, Link } from '@/i18n/routing';
import { TopAppBar, Card, Avatar, Button, Badge } from '@kiraka/ui';
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
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function MePage() {
  const t = useTranslations('me');
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  // User state (demo / local session)
  const [isSignedIn, setIsSignedIn] = React.useState(true);
  const [providerVisible, setProviderVisible] = React.useState(true);
  const [sessions, setSessions] = React.useState([
    {
      id: 'sess-1',
      device: 'Chrome on Android (Current)',
      ip: '197.243.12.44 · Kigali',
      isCurrent: true,
      lastActive: 'Active now',
    },
    {
      id: 'sess-2',
      device: 'Samsung Internet',
      ip: '197.243.10.12 · Kigali',
      isCurrent: false,
      lastActive: '2 days ago',
    },
  ]);

  const handleLanguageChange = (newLocale: 'en' | 'rw' | 'fr') => {
    router.replace(pathname, { locale: newLocale });
  };

  const handleRevokeOthers = () => {
    setSessions((prev) => prev.filter((s) => s.isCurrent));
    alert('Signed out of all other devices successfully.');
  };

  return (
    <div className="flex flex-col min-h-full">
      <TopAppBar title={t('title')} />

      <div className="p-4 max-w-xl mx-auto w-full space-y-4">
        {/* User Card */}
        {isSignedIn ? (
          <Card className="p-4 flex flex-col gap-3">
            <div className="flex items-center gap-4">
              <Avatar name="Eric Mugisha" size="lg" />
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h2 className="text-[18px] font-bold text-[var(--color-text)] truncate">
                    Eric Mugisha
                  </h2>
                </div>
                <p className="text-[13px] text-[var(--color-text-secondary)] truncate">
                  +250 788 ••• ••4 · Remera, Kigali
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {/* BR-12: Phone verified is strictly labeled Phone Verified, never Identity Verified */}
                  <Badge
                    status="open"
                    label="Phone Verified"
                    icon={ShieldCheck}
                  />
                  <span className="text-[11px] text-[var(--color-text-tertiary)]">
                    (Not an ID check)
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Mode / Visibility quick-toggle */}
            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between">
              <div>
                <p className="text-[13px] font-semibold text-[var(--color-text)]">
                  Provider Profile Visibility
                </p>
                <p className="text-[11px] text-[var(--color-text-tertiary)]">
                  {providerVisible ? 'Open to receive new jobs in Kigali' : 'Hidden from search and feeds'}
                </p>
              </div>
              <Button
                variant={providerVisible ? 'secondary' : 'primary'}
                size="sm"
                onClick={() => setProviderVisible(!providerVisible)}
              >
                {providerVisible ? (
                  <>
                    <EyeOff className="h-4 w-4 mr-1.5" /> Pause
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4 mr-1.5" /> Go Active
                  </>
                )}
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="p-5 text-center space-y-3">
            <h2 className="text-[18px] font-bold text-[var(--color-text)]">
              Welcome to KIRAKA
            </h2>
            <p className="text-[14px] text-[var(--color-text-secondary)]">
              Sign in with your phone number to post requests, submit offers, or view conversations.
            </p>
            <Button
              variant="primary"
              fullWidth
              onClick={() => router.push('/auth')}
            >
              Sign In with Mobile
            </Button>
          </Card>
        )}

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

          {/* Active Sessions & Security */}
          {isSignedIn && (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-[var(--color-primary)]" />
                  <div>
                    <h3 className="font-semibold text-[14px] text-[var(--color-text)]">
                      Active Devices & Sessions
                    </h3>
                    <p className="text-[12px] text-[var(--color-text-tertiary)]">
                      {sessions.length} active device(s)
                    </p>
                  </div>
                </div>
                {sessions.length > 1 && (
                  <button
                    onClick={handleRevokeOthers}
                    className="text-[12px] font-semibold text-[var(--color-danger)] hover:underline"
                  >
                    Sign out others
                  </button>
                )}
              </div>

              <div className="space-y-2 pt-2 border-t border-[var(--color-border)]">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between text-[12px] p-2 rounded bg-[var(--color-surface-2)]"
                  >
                    <div>
                      <p className="font-medium text-[var(--color-text)]">{s.device}</p>
                      <p className="text-[var(--color-text-tertiary)]">{s.ip}</p>
                    </div>
                    <span className="text-[var(--color-primary)] font-semibold">
                      {s.lastActive}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          )}

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

          {isSignedIn && (
            <Card
              interactive
              onClick={() => {
                setIsSignedIn(false);
                router.push('/auth');
              }}
              className="p-4 flex items-center justify-between text-[var(--color-danger)]"
            >
              <div className="flex items-center gap-3">
                <LogOut className="h-5 w-5" />
                <span className="font-semibold text-[14px]">{t('signOut')}</span>
              </div>
              <ChevronRight className="h-4 w-4 text-[var(--color-danger)]" />
            </Card>
          )}
        </div>

        {/* App Version Info */}
        <div className="pt-4 text-center">
          <p className="text-[12px] text-[var(--color-text-tertiary)]">
            KIRAKA PWA v0.1.0 · Kigali, Rwanda
          </p>
        </div>
      </div>
    </div>
  );
}
