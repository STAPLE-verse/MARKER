import { Navbar, NavbarStart, NavbarEnd } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { Dropdown, DropdownTrigger, DropdownContent, DropdownItem } from "@/components/ui/Dropdown";
import Link from "next/link";
import React from "react";
import { auth } from "@/auth";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <>
      <Navbar className="border-b border-base-300 sticky top-0 z-50 bg-base-100">
        <NavbarStart>
          <Link href="/dashboard" className="btn btn-ghost text-xl font-bold tracking-tight">
            MARKER
          </Link>
        </NavbarStart>
        <NavbarEnd className="flex items-center gap-2 pr-2">
          <Link href="/dashboard" className="btn btn-ghost">
            Dashboard
          </Link>
          
          {session?.user && (
            <Dropdown position="end">
              <DropdownTrigger>
                <div className="btn btn-ghost btn-circle avatar">
                  <Avatar email={session.user.email} fallback={session.user.username?.[0]} />
                </div>
              </DropdownTrigger>
              <DropdownContent className="w-52 mt-4 right-0 origin-top-right">
                <DropdownItem>
                  <Link href="/profile">Profile</Link>
                </DropdownItem>
                <DropdownItem>
                  <LogoutButton />
                </DropdownItem>
              </DropdownContent>
            </Dropdown>
          )}
        </NavbarEnd>
      </Navbar>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
    </>
  );
}
