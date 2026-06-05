import React from 'react';
import { cn } from '@/lib/utils';

const Sidebar = React.forwardRef<HTMLElement, React.HTMLAttributes<HTMLElement>>(
  ({ className, ...props }, ref) => (
    <aside ref={ref} className={cn("bg-base-200 text-base-content min-h-screen w-64 lg:w-80 flex flex-col transition-all duration-300", className)} {...props} />
  )
);
Sidebar.displayName = "Sidebar";

const SidebarHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 border-b border-base-300 min-h-[4rem] flex items-center", className)} {...props} />
  )
);
SidebarHeader.displayName = "SidebarHeader";

const SidebarContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto p-4", className)} {...props} />
  )
);
SidebarContent.displayName = "SidebarContent";

const SidebarMenu = React.forwardRef<HTMLUListElement, React.HTMLAttributes<HTMLUListElement>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("menu w-full p-0 gap-1", className)} {...props} />
  )
);
SidebarMenu.displayName = "SidebarMenu";

const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.LiHTMLAttributes<HTMLLIElement>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={className} {...props} />
  )
);
SidebarMenuItem.displayName = "SidebarMenuItem";

const SidebarFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 border-t border-base-300", className)} {...props} />
  )
);
SidebarFooter.displayName = "SidebarFooter";

export { Sidebar, SidebarHeader, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarFooter };
