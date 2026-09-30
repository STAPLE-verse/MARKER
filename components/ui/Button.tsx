import React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  wide?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  wide = false,
  className, 
  ...props 
}, ref) => {
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    accent: "btn-accent",
    ghost: "btn-ghost",
    link: "btn-link",
  }[variant];
  
  const sizeClasses = {
    lg: "btn-lg",
    md: "text-base",
    sm: "btn-md text-base",
    xs: "btn-md text-base",
  }[size];

  return (
    <button 
      ref={ref}
      className={cn(
        "btn transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        variantClasses,
        sizeClasses,
        wide && "btn-wide",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
