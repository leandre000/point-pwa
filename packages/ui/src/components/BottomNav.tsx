import * as React from 'react';
import { Home, Briefcase, PlusCircle, MessageSquare, User, type LucideIcon } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: LucideIcon;
  badgeCount?: number;
}

export const DEFAULT_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Home', href: '/', icon: Home },
  { id: 'jobs', label: 'Jobs', href: '/jobs', icon: Briefcase },
  { id: 'post', label: 'Post', href: '/post', icon: PlusCircle },
  { id: 'messages', label: 'Messages', href: '/messages', icon: MessageSquare },
  { id: 'me', label: 'Me', href: '/me', icon: User },
];

export interface BottomNavProps {
  items?: NavItem[];
  activeId: string;
  onSelect: (item: NavItem) => void;
  className?: string;
}

/**
 * Mobile-first Bottom Navigation
 * Height: 64px + safe-area-inset-bottom
 * 5 distinct tabs with clear icon + label
 */
export const BottomNav: React.FC<BottomNavProps> = ({
  items = DEFAULT_NAV_ITEMS,
  activeId,
  onSelect,
  className,
}) => {
  return (
    <nav
      aria-label="Main Navigation"
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 bg-[var(--color-surface)] border-t border-[var(--color-border)] pb-[env(safe-area-inset-bottom)] md:hidden',
        className,
      )}
    >
      <div className="flex h-16 items-center justify-around px-2">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const isPost = item.id === 'post';
          const Icon = item.icon;

          if (isPost) {
            return (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="flex flex-col items-center justify-center p-1 -mt-4 min-h-[48px] min-w-[48px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-[var(--radius-control)]"
                aria-label={item.label}
              >
                <div className="h-12 w-12 rounded-full bg-[var(--color-primary)] text-[var(--color-on-primary)] flex items-center justify-center shadow-sm hover:bg-[var(--color-primary-hover)] active:scale-95 transition-all">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
                <span className="text-[12px] font-semibold text-[var(--color-primary)] mt-1">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full min-h-[48px] min-w-[48px] py-1 transition-colors relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-[var(--radius-control)]',
                isActive
                  ? 'text-[var(--color-primary)] font-semibold'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)]',
              )}
            >
              <div className="relative">
                <Icon className="h-5 w-5" aria-hidden="true" />
                {item.badgeCount && item.badgeCount > 0 ? (
                  <span className="absolute -top-1.5 -right-2 h-4 min-w-[16px] px-1 rounded-full bg-[var(--color-danger)] text-white text-[10px] font-bold flex items-center justify-center">
                    {item.badgeCount > 99 ? '99+' : item.badgeCount}
                  </span>
                ) : null}
              </div>
              <span className="text-[12px] mt-1">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
BottomNav.displayName = 'BottomNav';
