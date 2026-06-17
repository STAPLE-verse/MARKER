import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** The semantic variant color of the badge */
  variant?: 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning' | 'error' | 'ghost' | 'neutral';
  /** If true, badge will be outlined instead of solid */
  outline?: boolean;
  /** Size of the badge */
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * Badge — a standard semantic status or label indicator.
 * Wraps DaisyUI badge classes into a strictly typed React component.
 */
export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, outline, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          "badge",
          variant && `badge-${variant}`,
          size && `badge-${size}`,
          outline && "badge-outline",
          className
        )}
        {...props}
      />
    );
  }
);
Badge.displayName = "Badge";
