import * as React from 'react';
import { Card } from './Card.js';
import { Button } from './Button.js';
import { Badge } from './Badge.js';
import { Star, Clock, MapPin, Briefcase, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface OfferCardProps {
  id: string;
  businessName: string;
  providerRating?: number | null;
  ratingCount?: number;
  completedJobs: number;
  areaName: string;
  distanceBand?: string;
  priceAmount: number;
  priceCurrency?: string;
  message?: string | null;
  availability?: string | null;
  version?: number;
  status?: string;
  canAccept?: boolean;
  canCounter?: boolean;
  onAccept?: () => void;
  onCounter?: () => void;
  onViewProfile?: () => void;
  className?: string;
}

/**
 * Offer Card for comparing proposals.
 * Rules:
 * - Price is prominently displayed in tabular numerals.
 * - Accept action triggers deliberate confirmation flow (FR-OFR-05).
 * - Coarse distance and neighborhood (BR-13).
 */
export const OfferCard: React.FC<OfferCardProps> = ({
  businessName,
  providerRating,
  ratingCount = 0,
  completedJobs,
  areaName,
  distanceBand = '~2 km',
  priceAmount,
  priceCurrency = 'RWF',
  message,
  availability,
  version = 1,
  status = 'SUBMITTED',
  canAccept = true,
  canCounter = true,
  onAccept,
  onCounter,
  onViewProfile,
  className,
}) => {
  return (
    <Card className={cn('p-4 space-y-3', className)}>
      {/* Header: Provider Info and Prominent Price */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col">
          <button
            type="button"
            onClick={onViewProfile}
            className="text-[16px] font-bold text-[var(--color-text)] hover:underline text-left"
          >
            {businessName}
          </button>

          <div className="flex items-center gap-2 mt-0.5 text-[12px] text-[var(--color-text-secondary)]">
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
              {areaName} ({distanceBand})
            </span>
          </div>
        </div>

        {/* Price headline */}
        <div className="flex flex-col items-end shrink-0">
          <span className="text-[22px] font-extrabold text-[var(--color-accent-text)] tabular-nums leading-tight">
            {priceAmount.toLocaleString()} {priceCurrency}
          </span>
          {version > 1 && (
            <span className="text-[11px] text-[var(--color-text-tertiary)]">
              Round {version} counter
            </span>
          )}
        </div>
      </div>

      {/* Trust & Reputation Row */}
      <div className="flex items-center gap-3 text-[12px] text-[var(--color-text-secondary)]">
        {providerRating ? (
          <div className="flex items-center gap-1 bg-[var(--color-accent-tint)] px-2 py-0.5 rounded text-[var(--color-accent-text)] font-bold">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="tabular-nums">{providerRating.toFixed(1)}</span>
            <span className="text-[11px] font-normal opacity-80">({ratingCount})</span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--color-text-tertiary)]">New provider</span>
        )}

        <span>·</span>
        <span className="flex items-center gap-1">
          <Briefcase className="h-3.5 w-3.5" />
          <span>{completedJobs} completed</span>
        </span>
      </div>

      {/* Offer Message and Arrival availability */}
      {message && (
        <p className="text-[13px] text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] p-2.5 rounded-[var(--radius-control)]">
          "{message}"
        </p>
      )}

      {availability && (
        <p className="text-[12px] text-[var(--color-text-tertiary)] flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> Availability: {availability}
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--color-border)]">
        <div>
          {status === 'ACCEPTED' ? (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#E8F1EC] text-[#1F513F]">
              ✓ Accepted Offer
            </span>
          ) : (
            <span className="text-[11px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-semibold">
              {status}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {canCounter && onCounter && status !== 'ACCEPTED' && (
            <Button variant="secondary" size="sm" onClick={onCounter}>
              Counter
            </Button>
          )}

          {canAccept && onAccept && status !== 'ACCEPTED' && (
            <Button variant="primary" size="sm" onClick={onAccept}>
              Accept {priceAmount.toLocaleString()} {priceCurrency}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
OfferCard.displayName = 'OfferCard';

