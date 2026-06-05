import { Navbar, NavbarStart, NavbarEnd } from "@/components/ui/Navbar";
import Link from "next/link";
import React from "react";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar className="border-b border-base-300 sticky top-0 z-50 bg-base-100">
        <NavbarStart>
          <Link href="/dashboard" className="btn btn-ghost text-xl font-bold tracking-tight">
            MARKER
          </Link>
        </NavbarStart>
        <NavbarEnd>
          <ul className="menu menu-horizontal px-1">
            <li>
              <Link href="/dashboard" className="font-medium">
                Dashboard
              </Link>
            </li>
          </ul>
        </NavbarEnd>
      </Navbar>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </>
  );
}
