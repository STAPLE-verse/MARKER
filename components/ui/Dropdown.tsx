"use client";

import React from 'react';
import { cn } from '@/lib/utils';

export interface DropdownProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'end' | 'top' | 'bottom' | 'left' | 'right';
  hover?: boolean;
}

export const Dropdown = React.forwardRef<HTMLDivElement, DropdownProps>(({
  children,
  position,
  hover = false,
  className,
  ...props
}, ref) => {
  const positionClass = position ? `dropdown-${position}` : '';
  const hoverClass = hover ? 'dropdown-hover' : '';

  return (
    <div 
      ref={ref}
      className={cn("dropdown", positionClass, hoverClass, className)}
      {...props}
    >
      {children}
    </div>
  );
});
Dropdown.displayName = 'Dropdown';

export const DropdownTrigger = React.forwardRef<HTMLLabelElement, React.LabelHTMLAttributes<HTMLLabelElement>>(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <label 
      ref={ref} 
      tabIndex={0} 
      className={cn(className)}
      {...props}
    >
      {children}
    </label>
  );
});
DropdownTrigger.displayName = 'DropdownTrigger';

export const DropdownContent = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(({
  children,
  className,
  ...props
}, ref) => {
  return (
    <ul 
      ref={ref} 
      tabIndex={0} 
      className={cn("dropdown-content z-[1] menu p-2 shadow bg-base-300 rounded-box", className)}
      {...props}
    >
      {children}
    </ul>
  );
});
DropdownContent.displayName = 'DropdownContent';

export const DropdownItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(({
  children,
  className,
  onClick,
  ...props
}, ref) => {
  return (
    <li 
      ref={ref} 
      className={className} 
      onClick={(e) => {
        if (onClick) onClick(e);
        // DaisyUI focus-based dropdown: blur the active element to close it.
        // We defer with setTimeout so inner click handlers execute first.
        setTimeout(() => {
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
        }, 0);
      }}
      {...props}
    >
      {children}
    </li>
  );
});
DropdownItem.displayName = 'DropdownItem';
