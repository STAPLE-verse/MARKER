import React from 'react';
import { cn } from '@/lib/utils';

/**
 * PageHeader — shared page-level heading component.
 *
 * Renders a consistent page title (h1) with an optional description
 * and an actions slot for buttons, links, or other controls.
 *
 * Based on STAPLE's PageHeader but extended to be composable:
 * - `children` slot for action buttons (e.g. "Create New", "Edit")
 * - `description` for optional subtitle text
 *
 * @example
 * // Simple title only
 * <PageHeader title="Dashboard" />
 *
 * @example
 * // Title with description and action button
 * <PageHeader title="Schemas" description="Browse published schemas">
 *   <Button variant="primary">New Schema</Button>
 * </PageHeader>
 */

const PageHeader = React.forwardRef<HTMLDivElement, Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> & {
  title: React.ReactNode;
  description?: React.ReactNode;
}>(({ title, description, children, className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}
    {...props}
  >
    <div className="flex-1 min-w-0">
      <h1 className="text-3xl font-bold leading-tight">{title}</h1>
      {description && (
        <p className="text-base-content/60 mt-2">{description}</p>
      )}
    </div>
    {children && (
      <div className="flex items-center gap-2 shrink-0">
        {children}
      </div>
    )}
  </div>
));
PageHeader.displayName = 'PageHeader';

export { PageHeader };
