import * as React from 'react';
import { cn } from '../utils/cn.js';
import { MapPin } from 'lucide-react';

export interface HeroBannerProps extends React.HTMLAttributes<HTMLDivElement> {
  areaName?: string;
  tagline?: string;
  subheading?: string;
  children?: React.ReactNode;
}

/**
 * Hero Banner with subtle topographic "Thousand Hills" contour-line texture overlay
 * and brand green gradient (#123B2C to #205641).
 */
export const HeroBanner: React.FC<HeroBannerProps> = ({
  areaName = 'Kigali, Rwanda',
  tagline = 'Find help. Discover opportunity.',
  subheading = "Kigali's trusted local services marketplace",
  children,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-[var(--radius-card)] p-5 text-[#FAF9F6] shadow-sm',
        'bg-gradient-to-br from-[#123B2C] via-[#1A4736] to-[#205641] border border-[#2A5E49]',
        className,
      )}
      {...props}
    >
      {/* Topographic Hills Texture Overlay (6-8% opacity) */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08] mix-blend-overlay"
        style={{
          backgroundImage: 'url(/images/topography.svg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center bottom',
          backgroundRepeat: 'no-repeat',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 space-y-3">
        {/* Neighborhood Pill */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FAF9F6]/15 backdrop-blur-sm text-[12px] font-semibold text-[#DCEBE1]">
          <MapPin className="h-3.5 w-3.5 text-[#E0A12B]" />
          <span>{areaName}</span>
        </div>

        <div>
          <h1 className="text-[22px] sm:text-[26px] font-extrabold tracking-tight text-[#FAF9F6] leading-tight font-display">
            {tagline}
          </h1>
          <p className="text-[13px] sm:text-[14px] text-[#B9D6C4] mt-1 font-medium">
            {subheading}
          </p>
        </div>

        {children && <div className="pt-2">{children}</div>}
      </div>
    </div>
  );
};

