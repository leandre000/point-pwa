import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { WifiOff, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '../utils/cn.js';

export const bannerVariants = cva(
  'w-full px-4 py-3 flex items-center justify-between gap-3 text-[14px] font-medium border-b select-none',
  {
    variants: {
      variant: {
        info: 'bg-[var(--color-info-tint)] text-[var(--color-info)] border-[var(--color-info)]',
        warning:
          'bg-[var(--color-warning-tint)] text-[var(--color-warning)] border-[var(--color-warning)]',
        offline:
          'bg-[var(--color-warning-tint)] text-[var(--color-warning)] border-[var(--color-warning)]',
      },
    },
    defaultVariants: {
      variant: 'info',
    },
  },
);

export interface BannerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof bannerVariants> {
  lastUpdated?: string;
  onDismiss?: () => void;
  message?: string;
}

export const Banner: React.FC<BannerProps> = ({
  className,
  variant = 'info',
  lastUpdated,
  onDismiss,
  message,
  children,
  ...props
}) => {
  const Icon = variant === 'offline' ? WifiOff : variant === 'warning' ? AlertTriangle : Info;

  return (
    <div
      role="status"
      className={cn(bannerVariants({ variant, className }))}
      {...props}
    >
      <div className="flex items-center gap-2.5 overflow-hidden">
        <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="truncate">
          {message || children}
          {variant === 'offline' && lastUpdated && (
            <span className="text-[12px] opacity-80 ml-2">
              · Last updated: {lastUpdated}
            </span>
          )}
        </div>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="p-1 rounded-[var(--radius-control)] hover:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Dismiss banner"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
Banner.displayName = 'Banner';

