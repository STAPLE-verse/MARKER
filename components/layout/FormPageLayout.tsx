import React from 'react';

interface FormPageLayoutProps {
  children: React.ReactNode;
  /** The BackButton component to render at the top left of the content */
  backButton: React.ReactNode;
  /** Optional absolute sidebar (e.g. VersionHistorySidebar) */
  sidebar?: React.ReactNode;
}

/**
 * Shared layout wrapper for the Form Builder ecosystem (Details, Edit, Publish).
 * Ensures that the layout stays exactly the same across all related pages,
 * and places the BackButton *inside* the main responsive container so it aligns
 * with the content rather than taking up the full monitor width.
 */
export function FormPageLayout({ children, backButton, sidebar }: FormPageLayoutProps) {
  return (
    <div className="relative min-h-screen bg-base-100 overflow-hidden flex">
      {/* Main Content Area */}
      <div className={`flex-1 h-screen overflow-y-auto flex flex-col relative ${sidebar ? 'pr-16' : ''}`}>
        
        {/* Floating BackButton: Top-left of the viewport, decoupled from the document flow */}
        <div className="absolute top-6 left-4 lg:left-8 z-10">
          {backButton}
        </div>

        <div className="container mx-auto px-4 pt-6 pb-8 max-w-6xl animate-in fade-in duration-300 flex-1 flex flex-col relative">
          
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
