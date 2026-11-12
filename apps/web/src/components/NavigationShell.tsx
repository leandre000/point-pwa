'use client';

import * as React from 'react';
import { usePathname, useRouter } from '@/i18n/routing';
import { useTranslations } from 'next-intl';
import { BottomNav, type NavItem, Logo } from '@kiraka/ui';
import { Briefcase, Home, MessageSquare, PlusCircle, User, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth-context.js';
import { useAuthGate } from '@/components/AuthGate.js';

export function NavigationShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('nav');
  const { isAuthenticated } = useAuth();
  const { openAuthGate } = useAuthGate();

  const navItems: NavItem[] = React.useMemo(
    () => [
      { id: 'home', label: t('home'), href: '/', icon: Home },
      { id: 'jobs', label: t('jobs'), href: '/jobs', icon: Briefcase },
      { id: 'post', label: t('post'), href: '/post', icon: PlusCircle },
      { id: 'messages', label: t('messages'), href: '/messages', icon: MessageSquare },
      { id: 'me', label: t('me'), href: '/me', icon: User },
    ],
    [t],
  );

  const activeId = React.useMemo(() => {
    if (pathname === '/') return 'home';
    if (pathname.startsWith('/jobs')) return 'jobs';
    if (pathname.startsWith('/post')) return 'post';
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/me')) return 'me';
    return 'home';
  }, [pathname]);

  const handleSelect = (item: NavItem) => {
    // Section 3: Gated tabs for guests
    if (!isAuthenticated && (item.id === 'post' || item.id === 'messages')) {
      openAuthGate(
        item.id === 'post'
          ? 'Sign in to post a task request to nearby Kigali service providers.'
          : 'Sign in to view your direct conversations with providers and customers.',
        item.href,
      );
      return;
    }
    router.push(item.href);
  };

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4 shrink-0">
        <div className="px-2 py-3 mb-4">
          <Logo variant="full" size="default" />
        </div>

        <nav className="flex flex-col gap-1.5 flex-1">
          {navItems.map((item) => {
            const isActive = item.id === activeId;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-[var(--radius-control)] text-[14px] font-medium transition-colors text-left ${
                  isActive
                    ? 'bg-[var(--color-primary-tint)] text-[var(--color-primary)] font-semibold'
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto pt-4 border-t border-[var(--color-border)] flex items-center gap-2 text-[12px] text-[var(--color-text-tertiary)]">
          <ShieldCheck className="h-4 w-4 text-[var(--color-primary)]" />
          <span>Local & Trust Verified</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col pb-20 md:pb-6 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        items={navItems}
        activeId={activeId}
        onSelect={handleSelect}
      />
    </div>
  );
}
