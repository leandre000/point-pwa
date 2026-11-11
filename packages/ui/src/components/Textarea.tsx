import * as React from 'react';
import { cn } from '../utils/cn.js';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, helperText, id, disabled, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;

    return (
      <div className="w-full flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[14px] font-medium text-[var(--color-text)] select-none"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : helperText ? helperId : undefined}
          className={cn(
            'w-full p-3.5 rounded-[var(--radius-control)] border text-[16px] text-[var(--color-text)] bg-[var(--color-surface)] placeholder:text-[var(--color-text-tertiary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50 disabled:bg-[var(--color-surface-2)] min-h-[96px]',
            error
              ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]'
              : 'border-[var(--color-border)] focus-visible:border-[var(--color-primary)]',
            className,
          )}
          {...props}
        />
        {error && (
          <p id={errorId} className="text-[12px] font-medium text-[var(--color-danger)]">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-[12px] text-[var(--color-text-secondary)]">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';

