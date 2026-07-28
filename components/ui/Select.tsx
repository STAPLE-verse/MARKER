import React from 'react';
import { cn } from '@/lib/utils';

export type SelectOption = {
  value: string;
  label: string;
};

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(({
  label,
  error,
  helperText,
  options,
  placeholder,
  className,
  ...props
}, ref) => {
  return (
    <div className="form-control w-full">
      {label && (
        <label className="label">
          <span className="label-text font-semibold">{label}</span>
        </label>
      )}
      <select
        ref={ref}
        className={cn(
          "select select-bordered w-full",
          error && "select-error",
          className
        )}
        defaultValue=""
        {...props}
      >
        {placeholder && (
          <option value="" disabled>{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
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

Select.displayName = 'Select';
