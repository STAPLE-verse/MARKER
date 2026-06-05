import React from 'react';
import { cn } from '@/lib/utils';

const Navbar = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("navbar bg-base-100", className)} {...props} />
  )
);
Navbar.displayName = "Navbar";

const NavbarStart = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("navbar-start", className)} {...props} />
  )
);
NavbarStart.displayName = "NavbarStart";

const NavbarCenter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("navbar-center", className)} {...props} />
  )
);
NavbarCenter.displayName = "NavbarCenter";

const NavbarEnd = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("navbar-end", className)} {...props} />
  )
);
NavbarEnd.displayName = "NavbarEnd";

export { Navbar, NavbarStart, NavbarCenter, NavbarEnd };
