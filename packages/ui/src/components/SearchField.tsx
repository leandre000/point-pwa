import * as React from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  onClear?: () => void;
  className?: string;
}

export const SearchField: React.FC<SearchFieldProps> = ({
  value,
  onChange,
  placeholder = 'Search providers or skills in Kigali...',
  loading = false,
  onClear,
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex items-center h-12 w-full rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[16px] text-[var(--color-text)] transition-colors focus-within:ring-2 focus-within:ring-[var(--color-primary)] min-h-[48px]',
        className,
      )}
    >
      {loading ? (
        <Loader2 className="h-5 w-5 text-[var(--color-text-tertiary)] animate-spin shrink-0 mr-2.5" />
      ) : (
        <Search className="h-5 w-5 text-[var(--color-text-tertiary)] shrink-0 mr-2.5" />
      )}
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent placeholder:text-[var(--color-text-tertiary)] focus:outline-none"
      />
      {value && (
        <button
          type="button"
          onClick={() => {
            onChange('');
            onClear?.();
          }}
          className="p-1 rounded-[var(--radius-control)] hover:bg-[var(--color-surface-2)] text-[var(--color-text-tertiary)] shrink-0 min-h-[36px] min-w-[36px] flex items-center justify-center"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
SearchField.displayName = 'SearchField';
