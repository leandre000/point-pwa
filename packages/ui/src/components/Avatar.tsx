import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn.js';

export const avatarVariants = cva(
  'relative inline-flex items-center justify-center shrink-0 overflow-hidden rounded-full font-medium select-none bg-[var(--color-primary-tint)] text-[var(--color-primary)] border border-[var(--color-border)]',
  {
    variants: {
      size: {
        sm: 'h-8 w-8 text-[12px]',
        md: 'h-10 w-10 text-[14px]',
        lg: 'h-14 w-14 text-[18px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  },
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  name: string;
  src?: string;
  alt?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  className,
  size,
  name,
  src,
  alt = name,
  ...props
}) => {
  const [imageError, setImageError] = React.useState(false);

  const getInitials = (text: string) => {
    const parts = text.trim().split(/\s+/);
    if (parts.length === 1) return parts[0]?.substring(0, 2).toUpperCase() || '';
    return ((parts[0]?.[0] || '') + (parts[1]?.[0] || '')).toUpperCase();
  };

  return (
    <div className={cn(avatarVariants({ size, className }))} {...props}>
      {src && !imageError ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getInitials(name)}</span>
      )}
    </div>
  );
};
Avatar.displayName = 'Avatar';
