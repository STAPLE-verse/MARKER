import { Navbar, NavbarStart, NavbarEnd } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
} from "@/components/ui/Dropdown";
import Link from "next/link";
import React from "react";
import { auth } from "@/auth";
import { LogoutButton } from "@/features/auth/components/LogoutButton";

/**
 * AppNavbar — the shared navigation bar used across all pages with navigation.
 *
 * This is a server component that reads the session and conditionally renders:
 * - Always: MARKER logo, Explore link
 * - Authenticated: Dashboard, Collection, Notifications, Avatar dropdown
 * - Unauthenticated: Login, Sign Up buttons
 *
 * Used by both `(public)/layout.tsx` and `(authenticated)/layout.tsx`.
 */
export default async function AppNavbar() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  return (
    <Navbar className="border-b border-base-300 sticky top-0 z-50 bg-base-100">
      <NavbarStart>
        <Link
          href={isLoggedIn ? "/dashboard" : "/"}
          className="btn btn-ghost text-xl font-bold tracking-tight"
        >
          MARKER
        </Link>
      </NavbarStart>
      <NavbarEnd className="flex items-center gap-1 pr-2">
        {isLoggedIn ? (
          <>
            {/* Authenticated nav */}
            <Link href="/notifications" className="btn btn-ghost btn-sm">
              Notifications
            </Link>
            <Link href="/dashboard" className="btn btn-ghost btn-sm">
              Dashboard
            </Link>
            <Link href="/collection" className="btn btn-ghost btn-sm">
              My Collection
            </Link>
            <Link href="/explore" className="btn btn-ghost btn-sm">
              Explore
            </Link>

            {/* Avatar dropdown */}
            <Dropdown position="end">
              <DropdownTrigger>
                <div className="btn btn-ghost btn-circle avatar">
                  <Avatar
                    email={session.user.email}
                    fallback={session.user.username?.[0]}
                  />
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
          </>
        ) : (
          <>
            {/* Unauthenticated nav */}
            <Link href="/explore" className="btn btn-ghost btn-sm">
              Explore
            </Link>
            <Link href="/login" className="btn btn-ghost btn-sm">
              Login
            </Link>
            <Link href="/signup" className="btn btn-primary btn-sm">
              Sign Up
            </Link>
          </>
        )}
      </NavbarEnd>
    </Navbar>
  );
}
