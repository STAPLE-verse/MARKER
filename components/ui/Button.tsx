import React from 'react';
import { cn } from '@/lib/utils';

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link';
  size?: 'lg' | 'md' | 'sm' | 'xs';
  outline?: boolean;
  wide?: boolean;
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  outline = false,
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
    md: "",
    sm: "btn-sm",
    xs: "btn-xs",
  }[size];

  return (
    <button 
      ref={ref}
      className={cn(
        "btn transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
        variantClasses,
        sizeClasses,
        outline && "btn-outline",
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
