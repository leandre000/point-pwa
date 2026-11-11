import * as React from 'react';
import { Card } from './Card.js';
import { Badge } from './Badge.js';
import { Star, MapPin, Briefcase, ShieldCheck } from 'lucide-react';
import { cn } from '../utils/cn.js';

export interface ProviderCardProps {
  id: string;
  businessName: string;
  bio?: string | null;
  areaName: string;
  distanceBand?: string;
  ratingAverage?: number | null;
  ratingCount: number;
  completedJobs: number;
  verificationLevel?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Provider Card component for local discovery feeds.
 * Rules:
 * - Coarse location only (area name + distance band). Never exact address (BR-13).
 * - Never shows phone number (BR-13).
 * - Honest verification badge (BR-12).
 */
export const ProviderCard: React.FC<ProviderCardProps> = ({
  businessName,
  bio,
  areaName,
  distanceBand = '~2 km',
  ratingAverage,
  ratingCount,
  completedJobs,
  verificationLevel,
  onClick,
  className,
}) => {
  return (
    <Card
      interactive={!!onClick}
      onClick={onClick}
      className={cn('p-4 space-y-3', className)}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="text-[16px] font-bold text-[var(--color-text)]">
            {businessName}
          </h3>
          <p className="text-[12px] text-[var(--color-text-secondary)] flex items-center gap-1.5 mt-0.5">
            <MapPin className="h-3.5 w-3.5 text-[var(--color-primary)] shrink-0" />
            <span>{areaName}</span>
            <span className="text-[var(--color-text-tertiary)]">({distanceBand})</span>
          </p>
        </div>

        {ratingAverage ? (
          <div className="flex items-center gap-1 bg-[var(--color-accent-tint)] px-2 py-0.5 rounded text-[var(--color-accent-text)] text-[13px] font-bold shrink-0">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="tabular-nums">{ratingAverage.toFixed(1)}</span>
            <span className="text-[11px] font-normal opacity-80">({ratingCount})</span>
          </div>
        ) : (
          <span className="text-[11px] text-[var(--color-text-tertiary)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded">
            New provider
          </span>
        )}
      </div>

      {bio && (
        <p className="text-[13px] text-[var(--color-text-secondary)] line-clamp-2">
          {bio}
        </p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border)] text-[12px]">
        <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
          <Briefcase className="h-3.5 w-3.5" />
          <span>{completedJobs} completed jobs</span>
        </div>

        {verificationLevel === 'PHONE_VERIFIED' && (
          <Badge
            status="open"
            label="Phone Verified"
            icon={ShieldCheck}
          />
        )}
      </div>
    </Card>
  );
};
ProviderCard.displayName = 'ProviderCard';
