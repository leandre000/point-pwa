import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '../utils/cn.js';

export const buttonVariants = cva(
  'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 disabled:pointer-events-none select-none text-[16px]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--color-primary)] text-[var(--color-on-primary)] hover:bg-[var(--color-primary-hover)] active:opacity-95 shadow-sm disabled:opacity-50 disabled:bg-[var(--color-border-strong)] disabled:text-[var(--color-text-secondary)]',
        secondary:
          'bg-[var(--color-surface)] text-[var(--color-text)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] active:opacity-95 disabled:opacity-50 disabled:border-[var(--color-border)]',
        tertiary:
          'bg-transparent text-[var(--color-primary)] hover:bg-[var(--color-primary-tint)] active:opacity-90 disabled:opacity-50',
        destructive:
          'bg-[var(--color-danger)] text-white hover:opacity-90 active:opacity-95 disabled:opacity-50',
      },
      size: {
        default: 'h-[52px] px-6 rounded-[var(--radius-control)] min-h-[48px]',
        sm: 'h-[44px] px-4 rounded-[var(--radius-control)] text-[14px] min-h-[44px]',
        lg: 'h-[56px] px-8 rounded-[var(--radius-control)] text-[18px] min-h-[48px]',
        icon: 'h-[48px] w-[48px] rounded-[var(--radius-control)] p-0 min-h-[48px] min-w-[48px]',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
      fullWidth: false,
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, fullWidth, loading = false, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" aria-hidden="true" />
            <span>{children}</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);
Button.displayName = 'Button';
