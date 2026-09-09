import React from 'react';
import { cn } from '@/lib/utils';

type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: React.ReactNode;
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
        <label className="label pb-2">
          <span className="label-text font-medium">{label}</span>
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

Textarea.displayName = 'Textarea';
