import * as React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Button, type ButtonProps } from './Button.js';
import { cn } from '../utils/cn.js';

export interface IconButtonProps extends Omit<ButtonProps, 'children'> {
  icon: LucideIcon;
  'aria-label': string;
  iconClassName?: string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, 'aria-label': ariaLabel, className, iconClassName, ...props }, ref) => {
    return (
      <Button
        ref={ref}
        size="icon"
        variant="secondary"
        className={cn('h-12 w-12 min-h-[48px] min-w-[48px]', className)}
        aria-label={ariaLabel}
        {...props}
      >
        <Icon className={cn('h-5 w-5', iconClassName)} aria-hidden="true" />
      </Button>
    );
  },
);
IconButton.displayName = 'IconButton';

