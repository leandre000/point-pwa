import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../utils/cn.js';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
  children?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className,
  children,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto',
        className,
      )}
    >
      {Icon && (
        <div className="h-16 w-16 rounded-full bg-[var(--color-primary-tint)] text-[var(--color-primary)] flex items-center justify-center mb-4">
          <Icon className="h-8 w-8" aria-hidden="true" />
        </div>
      )}
      <h2 className="text-[18px] font-semibold text-[var(--color-text)] mb-2">
        {title}
      </h2>
      <p className="text-[14px] text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {description}
      </p>
      {action && (
        <Button variant="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
      {children}
    </div>
  );
};
EmptyState.displayName = 'EmptyState';
