import React from 'react';

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
  className = '', 
  ...props 
}, ref) => {
  const baseClasses = "btn transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]";
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

  const outlineClass = outline ? "btn-outline" : "";
  const wideClass = wide ? "btn-wide" : "";

  return (
    <button 
      ref={ref}
      className={`${baseClasses} ${variantClasses} ${sizeClasses} ${outlineClass} ${wideClass} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
