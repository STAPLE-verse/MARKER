import React from 'react';
import { cn } from '@/lib/utils';

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
}

/**
 * Checkbox — a labeled checkbox input. Wraps the input and label text in a
 * single <label> so the input's accessible name comes from the label text
 * (matters for `getByRole("checkbox", { name: ... })` queries).
 *
 * daisyUI's `.label` sets `white-space: nowrap` unconditionally — fine for a
 * short role name, but it makes a long label (e.g. a full license name)
 * overflow its container instead of wrapping. `whitespace-normal` overrides
 * that; `min-w-0` on the text lets it actually shrink to wrap within a
 * narrow sidebar rather than pushing the flex row wider; `items-start` +
 * `shrink-0 mt-0.5` on the input keep the checkbox aligned to the first line
 * once the label wraps to two or more.
 */
export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, ...props }, ref) => (
    <label className="label cursor-pointer justify-start items-start gap-2 py-0.5 whitespace-normal">
      <input ref={ref} type="checkbox" className={cn("checkbox shrink-0 mt-0.5", className)} {...props} />
      {label && <span className="label-text min-w-0">{label}</span>}
    </label>
  )
);
Checkbox.displayName = 'Checkbox';
