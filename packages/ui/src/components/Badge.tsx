import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../utils/cn.js';

export const badgeVariants = cva(
  'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[var(--radius-pill)] text-[12px] font-medium select-none',
  {
    variants: {
      status: {
        open: 'bg-[var(--color-primary-tint)] text-[var(--color-primary)] border border-[var(--color-primary)]',
        matched: 'bg-[var(--color-info-tint)] text-[var(--color-info)] border border-[var(--color-info)]',
        in_progress:
          'bg-[var(--color-warning-tint)] text-[var(--color-warning)] border border-[var(--color-warning)]',
        completed:
          'bg-[var(--color-success-tint)] text-[var(--color-success)] border border-[var(--color-success)]',
        disputed:
          'bg-[var(--color-danger-tint)] text-[var(--color-danger)] border border-[var(--color-danger)]',
        cancelled:
          'bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)]',
        neutral:
          'bg-[var(--color-surface-2)] text-[var(--color-text)] border border-[var(--color-border)]',
      },
    },
    defaultVariants: {
      status: 'neutral',
    },
  },
);

const defaultStatusIcons: Record<NonNullable<VariantProps<typeof badgeVariants>['status']>, LucideIcon> = {
  open: Sparkles,
  matched: Clock,
  in_progress: Clock,
  completed: CheckCircle2,
  disputed: AlertTriangle,
  cancelled: XCircle,
  neutral: HelpCircle,
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  icon?: LucideIcon;
  label: string;
}

/**
 * Badge component — Always displays both an icon and a text label.
 * Rule: NEVER use color alone to communicate status.
 */
export const Badge: React.FC<BadgeProps> = ({
  className,
  status = 'neutral',
  icon: CustomIcon,
  label,
  ...props
}) => {
  const Icon = CustomIcon || defaultStatusIcons[status || 'neutral'];

  return (
    <span
      className={cn(badgeVariants({ status, className }))}
      role="status"
      {...props}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};
Badge.displayName = 'Badge';
