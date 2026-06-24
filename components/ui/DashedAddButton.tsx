import React from "react";
import { PlusIcon } from "@heroicons/react/24/outline";
import { cn } from "@/lib/utils";

type DashedAddButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

/**
 * Dashed-border add trigger matching the Form Builder "Add" control styling.
 * Kept in `components/ui/` for reuse across MARKER; the form-builder package
 * retains its own copy for standalone packaging (architecture.md §8.8).
 */
export const DashedAddButton = React.forwardRef<HTMLButtonElement, DashedAddButtonProps>(
  function DashedAddButton({ className, title = "Add", disabled, ...props }, ref) {
    return (
      <button
        ref={ref}
        type="button"
        title={title}
        disabled={disabled}
        className={cn(
          "group w-full py-2 flex justify-center cursor-pointer border-2 border-dashed border-base-300 hover:border-primary hover:bg-primary/5 rounded-lg transition-all",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-base-300 disabled:hover:bg-transparent",
          className
        )}
        {...props}
      >
        <PlusIcon className="h-6 w-6 text-base-content/50 group-hover:text-primary transition-colors group-disabled:group-hover:text-base-content/50" />
      </button>
    );
  }
);
