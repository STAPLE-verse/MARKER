import { Navbar, NavbarStart, NavbarEnd } from "@/components/ui/Navbar";
import { Avatar } from "@/components/ui/Avatar";
import { Logo } from "@/components/ui/Logo";
import { Breadcrumbs } from "./Breadcrumbs";
import { stapleSignupUrl } from "@/lib/staple";
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
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { getUnreadNotificationsCount } from "@/features/notifications/queries/getUnreadNotificationsCount";
import { getLatestUnreadNotifications } from "@/features/notifications/queries/getLatestUnreadNotifications";
import { getUserProfile } from "@/features/users/queries/getUserProfile";

/**
 * AppNavbar — the shared navigation bar used across all pages with navigation.
 *
 * This is a server component that reads the session and conditionally renders:
 * - Always: MARKER logo, breadcrumbs, Explore link
 * - Authenticated: Dashboard, Collection, Notifications, Avatar dropdown
 * - Unauthenticated: Login, Sign Up buttons
 *
 * Used by both `(public)/layout.tsx` and `(authenticated)/layout.tsx`.
 */
export default async function AppNavbar() {
  const session = await auth();
  const isLoggedIn = !!session?.user;
  const homeHref = isLoggedIn ? "/dashboard" : "/";

  // `session.user.username`/`.email` are JWT-cached at sign-in and only
  // change again at next login — reading a fresh `profile` row here means a
  // just-changed username/email/gravatar shows up in the navbar immediately.
  const [unreadCount, latestUnread, profile] = isLoggedIn
    ? await Promise.all([
        getUnreadNotificationsCount(Number(session.user.id)),
        getLatestUnreadNotifications(Number(session.user.id)),
        getUserProfile(Number(session.user.id)),
      ])
    : [0, [], null];

  // border-base-content/70: at least 3:1 against the page in every theme
  // (WCAG 1.4.11); base-300 on base-100 was barely visible.
  return (
    <Navbar className="border-b border-base-content/70 sticky top-0 z-50 bg-base-100">
      <NavbarStart className="gap-8 pl-4 min-w-0">
        <Link href={homeHref} className="shrink-0">
          <Logo variant="mark" className="h-7" />
        </Link>
        <Breadcrumbs homeHref={homeHref} />
      </NavbarStart>
      <NavbarEnd className="flex items-center gap-1 pr-2">
        {isLoggedIn ? (
          <>
            {/* Authenticated nav */}
            <NotificationBell initialUnreadCount={unreadCount} initialLatest={latestUnread} />

            {/* Nav links stay tight together as one group, set apart from the bell and the avatar. */}
            <div className="flex items-center gap-1 ml-3">
              <Link href="/dashboard" className="btn btn-ghost btn-md text-base">
                Dashboard
              </Link>
              <Link href="/collection" className="btn btn-ghost btn-md text-base">
                My Collection
              </Link>
              <Link href="/explore" className="btn btn-ghost btn-md text-base">
                Explore
              </Link>
            </div>

            {/* Avatar dropdown — extra left margin to visually separate it from the nav links */}
            <Dropdown position="end" className="ml-6">
              <DropdownTrigger>
                <div className="btn btn-ghost btn-circle avatar">
                  <Avatar
                    email={profile?.gravatar || profile?.email || session.user.email}
                    fallback={(profile?.username ?? session.user.username)?.[0]}
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
            <Link href="/explore" className="btn btn-ghost btn-md text-base">
              Explore
            </Link>
            <Link href="/login" className="btn btn-ghost btn-md text-base">
              Login
            </Link>
            {/* tooltip-left: the button sits at the right edge of the
                viewport, where a centered tooltip would be clipped. */}
            <div className="tooltip tooltip-left" data-tip="Takes you to STAPLE to create your account">
              <a href={stapleSignupUrl()} className="btn btn-primary btn-md text-base">
                Sign Up
              </a>
            </div>
          </>
        )}
      </NavbarEnd>
    </Navbar>
  );
}
