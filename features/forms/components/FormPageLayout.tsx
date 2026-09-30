import React from 'react';

interface FormPageLayoutProps {
  children: React.ReactNode;
  /** Optional right rail (e.g. VersionHistorySidebar) */
  sidebar?: React.ReactNode;
}

/**
 * Shared layout wrapper for the Form Builder ecosystem (Details, Edit, Publish).
 * Ensures that the layout stays exactly the same across all related pages —
 * in particular the same content width, so moving between viewing a schema
 * and editing it doesn't make the page jump.
 *
 * Two in-flow columns — content and an optional sidebar. Nothing is
 * absolutely positioned, so the columns always reserve their own width
 * instead of painting over the content when the viewport (or an open sidebar)
 * leaves the content column short. The content takes 80% of its column (all
 * of it on small screens), so it simply grows when a sidebar collapses.
 */
export function FormPageLayout({ children, sidebar }: FormPageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-base-100 overflow-hidden flex">
      {/* Main Content Area — `min-w-0` so it can shrink instead of pushing the
          sidebar off-screen. */}
      <div className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col relative">
        <div className="w-full lg:w-4/5 mx-auto px-4 pt-6 pb-8 animate-in fade-in duration-300 flex-1 flex flex-col relative">
          {/* Page Content */}
          <div className="flex-1 flex flex-col relative">
            {children}
          </div>
        </div>
      </div>

      {/* History Sidebar / Right Rail */}
      {sidebar}
    </div>
  );
}
