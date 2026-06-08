import React from "react";
import AppNavbar from "@/components/nav/AppNavbar";

/**
 * Public layout — pages accessible without authentication.
 * Shows the shared AppNavbar (which adapts to auth state)
 * but does NOT require login.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppNavbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
