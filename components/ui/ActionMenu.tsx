"use client";

import { EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Dropdown, DropdownContent, DropdownTrigger } from "./Dropdown";

export interface ActionMenuProps {
  /** DropdownItems for each secondary action. */
  children: React.ReactNode;
  ariaLabel?: string;
  className?: string;
}

/**
 * Overflow menu for a page's secondary, less-frequent actions — built on the
 * existing Dropdown primitives (elsewhere only used for the navbar's account
 * menu) behind an ellipsis trigger, so a primary action row doesn't have to
 * grow with every occasional action a form can support.
 */
export function ActionMenu({ children, ariaLabel = "More actions", className }: ActionMenuProps) {
  return (
    <Dropdown position="end" className={className}>
      <DropdownTrigger className="btn btn-ghost btn-md text-base btn-circle" aria-label={ariaLabel}>
        <EllipsisVerticalIcon className="h-5 w-5" />
      </DropdownTrigger>
      {/* `right-0`: pin the menu's right edge to the trigger so it opens
          leftwards. `dropdown-end` alone doesn't do it here, and a menu that
          opens rightwards gets cut off by the scrolling content column (or
          hidden under the history sidebar). Same fix as the navbar's avatar menu. */}
      <DropdownContent className="w-56 mt-2 right-0">{children}</DropdownContent>
    </Dropdown>
  );
}
