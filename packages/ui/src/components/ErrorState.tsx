import * as React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button.js';
import { cn } from '../utils/cn.js';

export interface ErrorStateProps {
  title?: string;
  description: string;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  description,
  onRetry,
  retryLabel = 'Try again',
  className,
}) => {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto my-auto',
        className,
      )}
    >
      <div className="h-16 w-16 rounded-full bg-[var(--color-danger-tint)] text-[var(--color-danger)] flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8" aria-hidden="true" />
      </div>
      <h2 className="text-[18px] font-semibold text-[var(--color-text)] mb-2">
        {title}
      </h2>
      <p className="text-[14px] text-[var(--color-text-secondary)] mb-6 max-w-sm">
        {description}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
          {retryLabel}
        </Button>
      )}
    </div>
  );
};
ErrorState.displayName = 'ErrorState';

