import React from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  helperText?: string;
};

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label,
  error,
  helperText,
  className,
  ...props
}, ref) => {
  return (
    <div className="form-control w-full mt-6">
      {label && (
        <label className="label">
          <span className="label-text font-semibold">{label}</span>
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "textarea textarea-bordered w-full text-base",
          error && "textarea-error",
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <label className="label">
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

Textarea.displayName = 'Textarea';
