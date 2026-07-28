import React from 'react';
import { cn } from '@/lib/utils';

export interface StepperProps extends React.HTMLAttributes<HTMLUListElement> {
  /** Array of step labels */
  steps: string[];
  /** The current active step (1-indexed) */
  currentStep: number;
}

/**
 * Stepper — a multi-step indicator component.
 * Wraps DaisyUI's `steps` component.
 */
export const Stepper = React.forwardRef<HTMLUListElement, StepperProps>(
  ({ steps, currentStep, className, ...props }, ref) => {
    return (
      <ul ref={ref} className={cn("steps", className)} {...props}>
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompletedOrCurrent = currentStep >= stepNumber;
          
          return (
            <li 
              key={index} 
              className={cn("step", isCompletedOrCurrent && "step-primary")}
            >
              {step}
            </li>
          );
        })}
      </ul>
    );
  }
);

Stepper.displayName = "Stepper";
