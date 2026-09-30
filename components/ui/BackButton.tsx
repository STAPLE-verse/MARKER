import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
import { ArrowLeftIcon } from '@heroicons/react/20/solid';

interface BackButtonProps {
  /** Optional URL to navigate to. If provided, the button acts as a link. */
  href?: string;
  /** Optional click handler for when it's used as a regular button (e.g., cancel). */
  onClick?: () => void;
  /** Label for the button. Keep it short ("Back") — the navbar breadcrumbs already say where it leads. */
  children: React.ReactNode;
  /** Disable the button interaction. */
  disabled?: boolean;
}

/**
 * BackButton — a plain secondary "Back" button.
 *
 * Most pages don't need one: the navbar breadcrumbs are the way back. This is
 * for the pages where going back does more than navigate (the form builder
 * checks for unsaved changes first). `whitespace-nowrap` keeps the label on
 * one line so it can never spill outside the button.
 */
export function BackButton({ href, onClick, children, disabled }: BackButtonProps) {
  const content = (
    <Button variant="secondary" size="md" onClick={onClick} disabled={disabled} className="whitespace-nowrap">
      <ArrowLeftIcon className="w-5 h-5" aria-hidden="true" />
      {children}
    </Button>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
