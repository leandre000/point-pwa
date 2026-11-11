import * as React from 'react';
import { cn } from '../utils/cn.js';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
  error?: string;
  className?: string;
}

export const OtpInput: React.FC<OtpInputProps> = ({
  value,
  onChange,
  length = 6,
  disabled = false,
  error,
  className,
}) => {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const char = e.target.value.slice(-1);
    if (!/^\d*$/.test(char)) return;

    const chars = value.split('');
    chars[index] = char;
    const newValue = chars.join('').slice(0, length);
    onChange(newValue);

    if (char && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text/plain').trim();
    if (/^\d+$/.test(pasted)) {
      const trimmed = pasted.slice(0, length);
      onChange(trimmed);
      const focusIndex = Math.min(trimmed.length, length - 1);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className={cn('flex flex-col items-center gap-2', className)}>
      <div className="flex gap-2 sm:gap-3 justify-center">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] || '';
          return (
            <input
              key={index}
              ref={(el) => {
                inputRefs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={index === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              value={digit}
              disabled={disabled}
              onChange={(e) => handleChange(e, index)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onPaste={handlePaste}
              aria-label={`Digit ${index + 1}`}
              className={cn(
                'h-14 w-12 sm:w-14 text-center text-[22px] font-bold rounded-[var(--radius-control)] border text-[var(--color-text)] bg-[var(--color-surface)] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] disabled:opacity-50',
                error
                  ? 'border-[var(--color-danger)] focus-visible:ring-[var(--color-danger)]'
                  : 'border-[var(--color-border)] focus-visible:border-[var(--color-primary)]',
              )}
            />
          );
        })}
      </div>
      {error && (
        <p className="text-[12px] font-medium text-[var(--color-danger)] mt-1">
          {error}
        </p>
      )}
    </div>
  );
};
OtpInput.displayName = 'OtpInput';

