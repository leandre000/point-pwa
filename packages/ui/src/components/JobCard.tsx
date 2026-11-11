import * as React from 'react';
import { Card } from './Card.js';
import { Badge } from './Badge.js';
import { MapPin, Clock, MessageSquare, Sparkles } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface JobCardProps {
  id: string;
  title: string;
  categoryName: string;
  areaName: string;
  budgetAmount?: number | null;
  budgetCurrency?: string;
  budgetNegotiable?: boolean;
  timingPreference?: string | null;
  offerCount?: number;
  timeAgo?: string;
  status?: string;
  photoCount?: number;
  onClick?: () => void;
  className?: string;
}

/**
 * Job Card component.
 * Rule: Price/Budget is the most prominent element on the card (headline).
 * Coarse location only (BR-13).
 */
export const JobCard: React.FC<JobCardProps> = ({
  title,
  categoryName,
  areaName,
  budgetAmount,
  budgetCurrency = 'RWF',
  budgetNegotiable = true,
  timingPreference,
  offerCount = 0,
  timeAgo,
  status = 'open',
  photoCount = 0,
  onClick,
  className,
}) => {
  const formattedBudget = budgetAmount
    ? `${budgetAmount.toLocaleString()} ${budgetCurrency}`
    : 'Negotiable';

  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn('p-4 space-y-3', className)}
    >
      {/* Top Header: Category and Price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[12px] font-semibold text-[var(--color-primary)] uppercase tracking-wide">
            {categoryName}
          </span>
          <h3 className="text-[16px] font-bold text-[var(--color-text)] line-clamp-1 mt-0.5">
            {title}
          </h3>
        </div>

        {/* Price is the loudest element on the card */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[20px] font-extrabold text-[var(--color-accent-text)] tabular-nums leading-tight">
            {formattedBudget}
          </span>
          {budgetAmount && budgetNegotiable && (
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              (Negotiable)
            </span>
          )}
        </div>
      </div>

      {/* Metadata Row */}
      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-[12px] text-[var(--color-text-secondary)]">
        <span className="flex items-center gap-1 font-medium">
          <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
          <span>{areaName}</span>
        </span>

        {timingPreference && (
          <>
            <span>·</span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <span>{timingPreference}</span>
            </span>
          </>
        )}

        {timeAgo && (
          <>
            <span>·</span>
            <span>{timeAgo}</span>
          </>
        )}
      </div>

      {/* Footer: Offer count & Status */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[12px]">
        <div className="flex items-center gap-1.5 text-[var(--color-text-secondary)]">
          <MessageSquare className="h-3.5 w-3.5" />
          <span>
            {offerCount === 0
              ? 'No offers yet'
              : `${offerCount} offer${offerCount === 1 ? '' : 's'}`}
          </span>
          {photoCount > 0 && (
            <span className="ml-2 text-[var(--color-text-tertiary)]">
              📷 {photoCount} photo{photoCount === 1 ? '' : 's'}
            </span>
          )}
        </div>

        <Badge
          status={status === 'open' ? 'open' : 'neutral'}
          label={status === 'open' ? 'Open' : status}
        />
      </div>
    </Card>
  );
};
JobCard.displayName = 'JobCard';
