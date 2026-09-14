import React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: React.ReactNode;
  error?: string;
  helperText?: string;
  /** Rendered inside the input box, right-aligned (e.g. a password show/hide toggle, a unit suffix, a clear button). */
  endAdornment?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  endAdornment,
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
      <div className={cn(endAdornment && "relative")}>
        <input
          ref={ref}
          className={cn(
            "input input-bordered w-full",
            error && "input-error",
            endAdornment && "pr-10",
            className
          )}
          {...props}
        />
        {endAdornment && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">{endAdornment}</div>
        )}
      </div>
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
