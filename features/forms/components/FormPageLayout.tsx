import React from 'react';

interface FormPageLayoutProps {
  children: React.ReactNode;
  /** The BackButton component to render in the left rail (or above the content on narrow screens) */
  backButton: React.ReactNode;
  /** Optional right rail (e.g. VersionHistorySidebar) */
  sidebar?: React.ReactNode;
  /**
   * Open state of `sidebar`. Pass it to let the content absorb the width a
   * collapsed sidebar releases, instead of re-centring in the wider column —
   * which slides it right, away from the back button.
   */
  sidebarOpen?: boolean;
}

/**
 * Shared layout wrapper for the Form Builder ecosystem (Details, Edit, Publish).
 * Ensures that the layout stays exactly the same across all related pages.
 *
 * Three in-flow columns — back-navigation rail, centered content, optional
 * sidebar. Nothing is absolutely positioned, so the columns always reserve
 * their own width instead of painting over the content when the viewport (or
 * an open sidebar) leaves the middle column short. Below `xl` there isn't room
 * for the rail next to the centered container, so the back button moves above
 * the content instead of beside it.
 */
export function FormPageLayout({ children, backButton, sidebar, sidebarOpen }: FormPageLayoutProps) {
  // 92rem = max-w-6xl + the 20rem a collapsed sidebar gives up (24rem open vs
  // 4rem collapsed). Both caps sit exactly that far apart, so the gutters
  // either side of the container work out identical in either state: toggling
  // the sidebar grows the content to the right instead of moving it.
  //
  // The cap has to *animate* with the sidebar rather than switch on the state
  // change: mid-transition the column has only partly grown, so an already-
  // widened cap lets the container fill it and the left edge jumps left before
  // drifting back. Transitioning max-width over the same 300ms keeps
  // `column - cap` constant for the whole toggle, so the left edge never moves.
  // `sidebar &&` because a caller may pass the state while rendering no
  // sidebar at all (`/schemas/[pid]` only has one when the family has
  // siblings) — there is no released width to absorb in that case.
  const contentWidth = sidebar && sidebarOpen === false ? "max-w-[92rem]" : "max-w-6xl";

  return (
    <div className="relative min-h-screen bg-base-100 overflow-hidden flex">
      {/* Back-navigation rail */}
      <div className="hidden xl:block shrink-0 w-48 pt-6 pl-6">
        {backButton}
      </div>

      {/* Main Content Area — `min-w-0` so it can shrink instead of pushing the
          rails off-screen. Without a sidebar, `2xl:pr-48` mirrors the rail so the
          container stays centred in the viewport instead of sitting half a rail
          to the right of it; `2xl` is where that becomes free here (192 +
          max-w-6xl + 192 = 1536), so it never costs content width. With a
          sidebar, the sidebar already balances the rail. */}
      <div className={`flex-1 min-w-0 h-screen overflow-y-auto flex flex-col relative ${sidebar ? '' : '2xl:pr-48'}`}>
        <div className={`container mx-auto px-4 pt-6 pb-8 ${contentWidth} transition-[max-width] animate-in fade-in duration-300 flex-1 flex flex-col relative`}>

          {/* Narrow screens: the rail is hidden, so the back button sits above the content */}
          <div className="xl:hidden mb-4">
            {backButton}
          </div>

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
