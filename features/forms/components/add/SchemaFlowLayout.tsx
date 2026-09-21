import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";

interface SchemaFlowLayoutProps {
  backHref: string;
  backLabel: string;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

/**
 * Shared layout for the "add schema" flow (`/collection/new` and its methods).
 *
 * Places the back button by the same rule as `FormPageLayout`: an in-flow rail
 * beside the content on wide screens, moving above the content once there's no
 * room for the rail. Nothing is absolutely positioned, so the button can never
 * end up on top of the content on a narrow viewport.
 */
export function SchemaFlowLayout({
  backHref,
  backLabel,
  title,
  description,
  children,
}: SchemaFlowLayoutProps) {
  const backButton = (
    <BackButton href={backHref}>{backLabel}</BackButton>
  );

  return (
    <div className="flex">
      {/* Back-navigation rail — `pt-8` matches the content container's `py-8` */}
      <div className="hidden xl:block shrink-0 w-48 pl-6 pt-8">
        {backButton}
      </div>

      {/* `xl:pr-48` mirrors the rail so the container stays centred in the
          viewport rather than sitting 96px (half a rail) to the right of it.
          Free above `xl`: 192 + max-w-4xl + 192 is exactly 1280. */}
      <div className="min-w-0 flex-1 xl:pr-48">
        <div className="container mx-auto max-w-4xl animate-in fade-in px-4 py-8 duration-300">
          {/* Narrow screens: the rail is hidden, so the button sits above the content */}
          <div className="mb-4 xl:hidden">{backButton}</div>

          <PageHeader title={title} description={description} />
          {children}
        </div>
      </div>
    </div>
  );
}
