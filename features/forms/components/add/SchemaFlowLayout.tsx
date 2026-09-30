import type { ReactNode } from "react";
import { PageHeader } from "@/components/ui/PageHeader";

interface SchemaFlowLayoutProps {
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

/**
 * Shared layout for the "add schema" flow (`/collection/new` and its methods).
 * No back button: the navbar breadcrumbs (Home > My Collection > New > …) are
 * the way back.
 */
export function SchemaFlowLayout({ title, description, children }: SchemaFlowLayoutProps) {
  return (
    <div className="container mx-auto max-w-4xl animate-in fade-in px-4 py-8 duration-300">
      <PageHeader title={title} description={description} />
      {children}
    </div>
  );
}
