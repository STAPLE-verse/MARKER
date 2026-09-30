import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

function tabItemClassName(active: boolean, className?: string) {
  return cn(
    "tab text-lg font-semibold transition-all",
    active ? "tab-active text-primary" : "text-base-content/90 hover:text-base-content",
    className
  );
}

type TabsProps = React.HTMLAttributes<HTMLDivElement>;

/** DaisyUI tab list container (`tabs tabs-bordered`). */
export function Tabs({ className, children, ...props }: TabsProps) {
  return (
    <div className={cn("tabs tabs-bordered", className)} {...props}>
      {children}
    </div>
  );
}

type TabTriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  active?: boolean;
};

/** Stateful tab control (local `useState`). */
export const TabTrigger = React.forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ active = false, className, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={tabItemClassName(active, className)}
      aria-selected={active}
      {...props}
    />
  )
);
TabTrigger.displayName = "TabTrigger";

type TabLinkProps = React.ComponentProps<typeof Link> & {
  active?: boolean;
};

/** Navigation tab control (URL / server-driven active state). */
export function TabLink({ active = false, className, prefetch = false, scroll = false, ...props }: TabLinkProps) {
  return (
    <Link
      prefetch={prefetch}
      scroll={scroll}
      className={tabItemClassName(active, className)}
      aria-current={active ? "page" : undefined}
      {...props}
    />
  );
}
