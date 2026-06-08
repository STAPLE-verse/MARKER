import React from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import AppNavbar from "@/components/nav/AppNavbar";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // Auth guard: redirect to login if not authenticated
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <>
      <AppNavbar />
      <main className="flex-1 flex flex-col">{children}</main>
    </>
  );
}
