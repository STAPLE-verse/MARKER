"use client";

import { signOut } from "next-auth/react";

/**
 * Client-side logout button.
 * Uses the same pattern as STAPLE's MainNavbar — a plain onClick handler
 * that calls the client-side signOut, avoiding form/server-action conflicts
 * with DaisyUI's focus-based dropdown.
 */
export function LogoutButton() {
  return (
    <button
      onClick={async () => {
        // Clear the session without letting Auth.js build the redirect URL:
        // behind the proxy it derives the host from the internal
        // localhost:3001 request. A relative navigation keeps the public host.
        await signOut({ redirect: false });
        window.location.assign("/login");
      }}
      className="w-full text-left"
    >
      Logout
    </button>
  );
}
