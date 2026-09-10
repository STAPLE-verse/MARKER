import type { ReactNode } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { PageHeader } from "@/components/ui/PageHeader";

interface SchemaFlowLayoutProps {
  backHref: string;
  backLabel: string;
  backButtonPlacement?: "inline" | "page-corner";
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
}

export function SchemaFlowLayout({
  backHref,
  backLabel,
  backButtonPlacement = "inline",
  title,
  description,
  children,
}: SchemaFlowLayoutProps) {
  const backButton = (
    <BackButton href={backHref}>{backLabel}</BackButton>
  );

  return (
    <div className="relative">
      {backButtonPlacement === "page-corner" && (
        <div className="absolute left-4 top-6 z-10 lg:left-8">
          {backButton}
        </div>
      )}
      <div className="container mx-auto max-w-4xl animate-in fade-in px-4 py-8 duration-300">
        {backButtonPlacement === "inline" && (
          <div className="mb-4">{backButton}</div>
        )}
        <PageHeader title={title} description={description} />
        {children}
      </div>
    </div>
  );
}
