import React from 'react';
import Link from 'next/link';
import { Button } from './Button';
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

/**
 * BackButton — shared top-left navigation escape hatch.
 * 
 * Ensures consistent padding and styling for "Back" or "Cancel" actions
 * that sit outside the main centered layout container.
 */
export function BackButton({ href, onClick, children, disabled }: BackButtonProps) {
  const content = (
    <Button 
      variant="ghost" 
      onClick={onClick} 
      disabled={disabled} 
      size="sm" 
      className="text-base-content/60 hover:text-base-content -ml-2"
    >
      <ArrowLeftIcon className="w-4 h-4 mr-1.5" />
      {children}
    </Button>
  );

  return (
    <div className="p-4 lg:px-8 pt-6 flex-none">
      {href ? <Link href={href}>{content}</Link> : content}
    </div>
  );
}
