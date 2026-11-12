import * as React from 'react';
import { CategoryIcon, CATEGORY_THEMES, type CategoryId } from './CategoryIcon.js';
import { cn } from '../utils/cn.js';

export interface CategoryTileProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  category: CategoryId | string;
  label?: string;
  count?: string | number;
  selected?: boolean;
  size?: 'sm' | 'default' | 'lg';
}

/**
 * Accessible Category Tile with high-contrast icon-on-tile styling
 * Guaranteed >= 3:1 contrast for graphical objects per WCAG AA.
 */
export const CategoryTile = React.forwardRef<HTMLButtonElement, CategoryTileProps>(
  ({ category, label, count, selected = false, size = 'default', className, onClick, ...props }, ref) => {
    const theme = CATEGORY_THEMES[category.toLowerCase()] || CATEGORY_THEMES['all']!;
    const displayLabel = label || theme.label;

    const sizeClasses = {
      sm: 'p-2.5 min-h-[44px] gap-2',
      default: 'p-3.5 min-h-[52px] gap-2.5',
      lg: 'p-4 min-h-[64px] gap-3',
    };

    const iconBoxSizes = {
      sm: 'w-8 h-8 rounded-lg',
      default: 'w-10 h-10 rounded-xl',
      lg: 'w-12 h-12 rounded-xl',
    };

    const iconPixelSizes = {
      sm: 18,
      default: 22,
      lg: 26,
    };

    return (
      <button
        ref={ref}
        type="button"
        onClick={onClick}
        className={cn(
          'group relative flex flex-col items-start justify-between rounded-[var(--radius-card)] border text-left transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2',
          'active:scale-[0.98]',
          selected
            ? 'border-[var(--color-primary)] bg-[var(--color-primary-tint)] shadow-sm'
            : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:shadow-sm',
          sizeClasses[size],
          className,
        )}
        aria-pressed={selected}
        {...props}
      >
        <div
          className={cn(
            'flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
            iconBoxSizes[size],
          )}
          style={{
            backgroundColor: theme.tileBg,
            color: theme.iconColor,
          }}
        >
          <CategoryIcon category={category} size={iconPixelSizes[size]} />
        </div>

        <div className="w-full mt-1">
          <span className="block font-bold text-[14px] leading-tight text-[var(--color-text)] tracking-tight">
            {displayLabel}
          </span>
          {count !== undefined && (
            <span className="block text-[12px] text-[var(--color-text-tertiary)] mt-0.5">
              {typeof count === 'number' ? `${count} available` : count}
            </span>
          )}
        </div>
      </button>
    );
  },
);

CategoryTile.displayName = 'CategoryTile';
