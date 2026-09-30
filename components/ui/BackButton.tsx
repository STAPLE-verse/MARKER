import React from 'react';
import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

interface BackButtonProps {
  /** Optional URL to navigate to. If provided, the button acts as a link. */
  href?: string;
  /** Optional click handler for when it's used as a regular button (e.g., cancel). */
  onClick?: () => void;
  /** Label for the button. */
  children: React.ReactNode;
  /** Disable the button interaction. */
  disabled?: boolean;
}

// A text link rather than a `btn`: daisyUI buttons have a fixed height, so a
// label long enough to wrap in a narrow column spilled outside the button's
// box. Plain text wraps freely; hovering or focusing highlights the text itself.
const LINK_CLASS =
  "inline-flex items-center gap-1.5 text-lg font-semibold text-base-content " +
  "hover:text-primary hover:underline focus-visible:text-primary focus-visible:underline " +
  "underline-offset-4 transition-colors";

/**
 * BackButton — shared top-left navigation escape hatch.
 *
 * Ensures consistent styling for "Back" or "Cancel" actions that sit outside
 * the main centered layout container.
 */
export function BackButton({ href, onClick, children, disabled }: BackButtonProps) {
  const content = (
    <>
      <ArrowLeftIcon className="w-5 h-5 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </>
  );

  if (href && !disabled) {
    return (
      <Link href={href} onClick={onClick} className={LINK_CLASS}>
        {content}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`${LINK_CLASS} cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:no-underline`}
    >
      {content}
    </button>
  );
}
