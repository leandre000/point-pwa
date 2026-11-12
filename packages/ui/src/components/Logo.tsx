import * as React from 'react';
import { cn } from '../utils/cn.js';

export interface LogoProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'full' | 'mark' | 'wordmark';
  theme?: 'brand' | 'light' | 'dark' | 'white';
  size?: 'sm' | 'default' | 'lg';
  showTagline?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  theme = 'brand',
  size = 'default',
  showTagline = true,
  className,
  ...props
}) => {
  const markDimensions = {
    sm: { box: 32, rx: 8, fontTitle: 'text-[16px]', fontTag: 'text-[10px]' },
    default: { box: 40, rx: 10, fontTitle: 'text-[20px]', fontTag: 'text-[12px]' },
    lg: { box: 52, rx: 13, fontTitle: 'text-[26px]', fontTag: 'text-[13px]' },
  };

  const dim = markDimensions[size];

  const markBg = {
    brand: '#205641',
    light: '#FAF9F6',
    dark: '#151D18',
    white: '#FFFFFF',
  }[theme];

  const stemColor = {
    brand: '#FAF9F6',
    light: '#205641',
    dark: '#6CC49A',
    white: '#205641',
  }[theme];

  const textColor = {
    brand: 'text-[var(--color-text)]',
    light: 'text-[#FAF9F6]',
    dark: 'text-[#EAF0EC]',
    white: 'text-[#FFFFFF]',
  }[theme];

  const tagColor = {
    brand: 'text-[var(--color-text-tertiary)]',
    light: 'text-[#FAF9F6]/80',
    dark: 'text-[#B4C0B8]',
    white: 'text-[#FFFFFF]/85',
  }[theme];

  return (
    <div className={cn('inline-flex items-center gap-3 select-none', className)} {...props}>
      {variant !== 'wordmark' && (
        <div
          className="flex items-center justify-center shrink-0 shadow-sm"
          style={{
            width: dim.box,
            height: dim.box,
            borderRadius: dim.rx,
            backgroundColor: markBg,
          }}
          aria-hidden="true"
        >
          <svg
            viewBox="0 0 192 192"
            width={dim.box * 0.72}
            height={dim.box * 0.72}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Vertical stem */}
            <rect x="44" y="42" width="22" height="108" rx="7" fill={stemColor} />
            {/* Lower leg */}
            <path
              d="M66 102 L118 150 C121 153 126 153 130 150 L140 140 C143 137 143 132 140 129 L96 89 Z"
              fill={stemColor}
            />
            {/* Upper arm */}
            <path
              d="M66 90 L108 52 C111 49 116 50 119 53 L126 60 C129 63 129 68 126 71 L88 106 Z"
              fill={stemColor}
            />
            {/* Location Pin Head */}
            <path
              d="M130 38 C144 38 155 49 155 63 C155 77 138 97 132 103 C131 104 129 104 128 103 C122 97 105 77 105 63 C105 49 116 38 130 38 Z"
              fill="#E0A12B"
            />
            {/* Location Pin cutout */}
            <circle cx="130" cy="63" r="8" fill={markBg} />
          </svg>
        </div>
      )}

      {variant !== 'mark' && (
        <div className="flex flex-col justify-center">
          <span
            className={cn(
              'font-extrabold tracking-tight leading-none font-display',
              dim.fontTitle,
              textColor,
            )}
          >
            KIRAKA
          </span>
          {showTagline && (
            <span
              className={cn(
                'font-medium tracking-normal mt-0.5 leading-tight',
                dim.fontTag,
                tagColor,
              )}
            >
              Find help. Discover opportunity.
            </span>
          )}
        </div>
      )}
    </div>
  );
};

