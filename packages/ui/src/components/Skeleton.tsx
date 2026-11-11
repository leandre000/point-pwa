import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn.js';

export const skeletonVariants = cva(
  'animate-pulse bg-[var(--color-surface-2)] rounded-[var(--radius-control)]',
  {
    variants: {
      variant: {
        text: 'h-4 w-full rounded',
        circle: 'rounded-full aspect-square',
        rect: 'w-full h-24 rounded-[var(--radius-control)]',
        card: 'w-full h-40 rounded-[var(--radius-card)] border border-[var(--color-border)]',
      },
    },
    defaultVariants: {
      variant: 'rect',
    },
  },
);

export interface SkeletonProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof skeletonVariants> {}

export const Skeleton: React.FC<SkeletonProps> = ({ className, variant, ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={cn(skeletonVariants({ variant, className }))}
      {...props}
    />
  );
};
Skeleton.displayName = 'Skeleton';

