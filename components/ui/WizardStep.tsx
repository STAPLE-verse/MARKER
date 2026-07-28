import React from 'react';
import { cn } from '@/lib/utils';

export interface WizardStepProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  /** The main title of the step */
  title: React.ReactNode;
  /** A brief description of what the user needs to do in this step */
  description: React.ReactNode;
}

/**
 * A standard container for wizard steps. 
 * Includes built-in slide-in animation and standardized header spacing.
 */
export function WizardStep({ title, description, children, className, ...props }: WizardStepProps) {
  return (
    <div className={cn("space-y-8 animate-in fade-in slide-in-from-right-4 duration-300", className)} {...props}>
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-base-content/70 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );
}
