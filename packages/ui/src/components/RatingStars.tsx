import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '../utils/index.js';

export interface RatingStarsProps {
  value?: number; // 0 to 5 (0 = unrated / empty)
  onChange?: (rating: number) => void;
  max?: number;
  readOnly?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export const RatingStars: React.FC<RatingStarsProps> = ({
  value = 0,
  onChange,
  max = 5,
  readOnly = false,
  size = 'md',
  className,
  label = 'Rating',
}) => {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const starSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  const buttonSizes = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-12 h-12 min-h-[48px] min-w-[48px]', // Touch target requirement
  };

  const activeRating = hoverValue ?? value;

  return (
    <div
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={`${label}: ${value} out of ${max} stars`}
      className={cn('inline-flex items-center gap-1', className)}
    >
      {Array.from({ length: max }, (_, index) => {
        const starNumber = index + 1;
        const isFilled = starNumber <= activeRating;

        if (readOnly) {
          return (
            <Star
              key={index}
              className={cn(
                starSizes[size],
                isFilled
                  ? 'fill-[var(--accent)] text-[var(--accent)]'
                  : 'fill-transparent text-[var(--border-strong)]',
              )}
              aria-hidden="true"
            />
          );
        }

        return (
          <button
            key={index}
            type="button"
            role="radio"
            aria-checked={value === starNumber}
            aria-label={`${starNumber} star${starNumber > 1 ? 's' : ''}`}
            onClick={() => onChange?.(starNumber)}
            onMouseEnter={() => setHoverValue(starNumber)}
            onMouseLeave={() => setHoverValue(null)}
            onFocus={() => setHoverValue(starNumber)}
            onBlur={() => setHoverValue(null)}
            className={cn(
              'inline-flex items-center justify-center rounded-md transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]',
              buttonSizes[size],
            )}
          >
            <Star
              className={cn(
                starSizes[size],
                'transition-transform duration-150',
                isFilled
                  ? 'fill-[var(--accent)] text-[var(--accent)] scale-110'
                  : 'fill-transparent text-[var(--border-strong)] hover:text-[var(--accent)]',
              )}
              aria-hidden="true"
            />
          </button>
        );
      })}
    </div>
  );
};

