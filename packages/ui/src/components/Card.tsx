import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../utils/cn.js';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  asChild?: boolean;
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, asChild = false, interactive = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'div';
    return (
      <Comp
        ref={ref}
        className={cn(
          'rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 text-[var(--color-text)] transition-all',
          interactive &&
            'cursor-pointer hover:border-[var(--color-border-strong)] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]',
          className,
        )}
        {...props}
      />
    );
  },
);
Card.displayName = 'Card';
