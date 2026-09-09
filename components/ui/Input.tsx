import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  className,
  ...props
}, ref) => {
  return (
    <div className="form-control w-full">
      {label && (
        <label className="label pb-2">
          <span className="label-text font-medium">{label}</span>
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "input input-bordered w-full",
          error && "input-error",
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <label className="label pt-2">
          <span className={cn(
            "label-text-alt",
            error ? "text-error" : "text-base-content/70"
          )}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
});

Input.displayName = 'Input';
