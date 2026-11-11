import * as React from 'react';
import { cn } from '../utils/cn.js';

export interface PhoneInputProps {
  value: string; // e.g. "788123456"
  onChange: (value: string) => void;
  countryCode?: string; // default "+250"
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  countryCode = '+250',
  label,
  error,
  disabled = false,
  className,
}) => {
  const id = React.useId();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits and remove any leading zero
    let raw = e.target.value.replace(/\D/g, '');
    if (raw.startsWith('0')) {
      raw = raw.substring(1);
    }
    onChange(raw);
  };

  return (
    <div className={cn('w-full flex flex-col gap-1.5', className)}>
      {label && (
        <label
          htmlFor={id}
          className="text-[14px] font-medium text-[var(--color-text)] select-none"
        >
          {label}
        </label>
      )}
      <div
        className={cn(
          'flex h-12 w-full rounded-[var(--radius-control)] border bg-[var(--color-surface)] transition-colors focus-within:ring-2 focus-within:ring-[var(--color-primary)] min-h-[48px]',
          error ? 'border-[var(--color-danger)]' : 'border-[var(--color-border)]',
          disabled && 'opacity-50 bg-[var(--color-surface-2)]',
        )}
      >
        <div className="flex items-center gap-1.5 px-3 border-r border-[var(--color-border)] bg-[var(--color-surface-2)] text-[14px] font-semibold text-[var(--color-text)] select-none shrink-0">
          <span role="img" aria-label="Rwanda Flag">🇷🇼</span>
          <span>{countryCode}</span>
        </div>
        <input
          id={id}
          type="tel"
          inputMode="tel"
          disabled={disabled}
          value={value}
          onChange={handleInputChange}
          placeholder="788 123 456"
          className="w-full px-3 text-[16px] text-[var(--color-text)] bg-transparent placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
        />
      </div>
      {error && (
        <p className="text-[12px] font-medium text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
};
PhoneInput.displayName = 'PhoneInput';
