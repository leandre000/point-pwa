import * as React from 'react';
import { ChevronLeft } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface TopAppBarProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: React.ReactNode;
  className?: string;
}

export const TopAppBar: React.FC<TopAppBarProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  className,
}) => {
  return (
    <header
      className={cn(
        'sticky top-0 z-30 h-14 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 flex items-center justify-between gap-3',
        className,
      )}
    >
      <div className="flex items-center gap-2 overflow-hidden">
        {onBack && (
          <button
            onClick={onBack}
            className="p-2 -ml-2 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] active:opacity-75 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] min-h-[48px] min-w-[48px] flex items-center justify-center"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6 text-[var(--color-text)]" aria-hidden="true" />
          </button>
        )}
        <div className="flex flex-col overflow-hidden">
          <h1 className="text-[18px] font-semibold text-[var(--color-text)] truncate leading-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[12px] text-[var(--color-text-secondary)] truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </header>
  );
};
TopAppBar.displayName = 'TopAppBar';
