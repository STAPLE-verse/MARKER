import React from 'react';
import { cn } from '@/lib/utils';
import { stapleFieldClass } from './fieldStyles';

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
          <span className="label-text text-xl text-base-content">{label}</span>
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "textarea w-full text-base",
          stapleFieldClass("textarea", !!error),
          className
        )}
        {...props}
      />
      {(error || helperText) && (
        <label className="label pt-2">
          <span className={cn(
            "label-text-alt",
            error ? "text-error" : "text-base-content/90"
          )}>
            {error || helperText}
          </span>
        </label>
      )}
    </div>
  );
});

Textarea.displayName = 'Textarea';
