import * as React from 'react';

export type CategoryId = 'cleaning' | 'plumbing' | 'electrical' | 'carpentry' | 'maintenance' | 'all';

export interface CategoryIconProps extends React.SVGProps<SVGSVGElement> {
  category: CategoryId | string;
  size?: number;
}

export const CATEGORY_THEMES: Record<
  string,
  {
    iconColor: string;
    tileBg: string;
    label: string;
    darkIconColor: string;
    darkTileBg: string;
  }
> = {
  cleaning: {
    iconColor: '#0E7C86',
    tileBg: '#E3F4F5',
    darkIconColor: '#4FD1DE',
    darkTileBg: '#13282B',
    label: 'Cleaning',
  },
  plumbing: {
    iconColor: '#2B6CB0',
    tileBg: '#E8F0FA',
    darkIconColor: '#7FB0E8',
    darkTileBg: '#14202E',
    label: 'Plumbing',
  },
  electrical: {
    iconColor: '#B7791F',
    tileBg: '#FBF1DC',
    darkIconColor: '#E8B957',
    darkTileBg: '#2B2312',
    label: 'Electrical',
  },
  carpentry: {
    iconColor: '#9A5B34',
    tileBg: '#F6EBE3',
    darkIconColor: '#E08A63',
    darkTileBg: '#2C1A13',
    label: 'Carpentry',
  },
  maintenance: {
    iconColor: '#4F6F52',
    tileBg: '#E9F0E6',
    darkIconColor: '#8EBA92',
    darkTileBg: '#1A261B',
    label: 'General Maintenance',
  },
  all: {
    iconColor: '#205641',
    tileBg: '#EEF5F0',
    darkIconColor: '#6CC49A',
    darkTileBg: '#17271F',
    label: 'All Categories',
  },
};

/**
 * Custom hand-crafted SVG Category Icons
 * Strictly engineered on a 24x24 grid with 1.75 stroke-width and rounded caps/joins.
 */
export const CategoryIcon: React.FC<CategoryIconProps> = ({
  category,
  size = 24,
  className,
  ...props
}) => {
  const normCat = (category || 'all').toLowerCase();

  switch (normCat) {
    case 'cleaning':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          {...props}
        >
          {/* Spray bottle trigger & nozzle */}
          <path d="M7 8h4v2H7z" />
          <path d="M11 9l2 2" />
          {/* Spray bottle container */}
          <path d="M6 10h6l1.2 9.5a1.5 1.5 0 0 1-1.5 1.5H6.3a1.5 1.5 0 0 1-1.5-1.5L6 10z" />
          {/* Liquid level */}
          <path d="M6.5 16h5" strokeDasharray="1 1" />
          {/* Clean sparkle stars */}
          <path d="M18 4v4m-2-2h4" />
          <path d="M19 13v3m-1.5-1.5h3" />
        </svg>
      );

    case 'plumbing':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          {...props}
        >
          {/* Water Droplet */}
          <path d="M7 14a3 3 0 0 0 6 0c0-2-3-5.5-3-5.5S7 12 7 14z" />
          {/* Pipe wrench handle and jaws */}
          <path d="M14 4h4v3.5h-4z" />
          <path d="M14 6l-3 3" />
          <path d="M11 9l8 8a2 2 0 0 1-2.8 2.8l-8-8" />
          <path d="M18 17l2 2" />
        </svg>
      );

    case 'electrical':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          {...props}
        >
          {/* Wall plug prongs */}
          <path d="M9 3v4" />
          <path d="M15 3v4" />
          {/* Plug housing */}
          <path d="M6.5 7h11a1 1 0 0 1 1 1v3.5a6.5 6.5 0 0 1-13 0V8a1 1 0 0 1 1-1z" />
          {/* Lightning spark in center */}
          <path d="M12 9.5l-1.8 3h3.6L12 16" />
          {/* Cable tail */}
          <path d="M12 18v3" />
        </svg>
      );

    case 'carpentry':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          {...props}
        >
          {/* Wood plane base sole */}
          <path d="M3 18h18a1 1 0 0 0 1-1v-2H2v2a1 1 0 0 0 1 1z" />
          {/* Angled wooden body */}
          <path d="M4 15l3-6h8l4 6" />
          {/* Sharp cutting iron blade */}
          <path d="M10 7.5l3.5 7.5" />
          {/* Wooden knob / tote handle */}
          <path d="M6 10a1.5 1.5 0 1 1 3 0" />
        </svg>
      );

    case 'maintenance':
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          {...props}
        >
          {/* Open-ended wrench */}
          <path d="M16.5 3.5a3.5 3.5 0 0 0-4.5 1.2l-6.8 6.8a2 2 0 0 0 0 2.8l1.4 1.4a2 2 0 0 0 2.8 0l6.8-6.8a3.5 3.5 0 0 0 1.2-4.5l-1.8 1.8-1.5-.4-.4-1.5 2.8-2.8z" />
          {/* Screwdriver crossed behind */}
          <path d="M4 20l4-4" />
          <path d="M18 6l2-2" />
        </svg>
      );

    case 'all':
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          width={size}
          height={size}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
          aria-hidden="true"
          {...props}
        >
          {/* 2x2 Rounded Modular Tile Grid */}
          <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
          <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
          <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
        </svg>
      );
  }
};

