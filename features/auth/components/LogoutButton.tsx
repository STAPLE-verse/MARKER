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
        await signOut({ redirectTo: "/login" });
      }}
      className="w-full text-left"
    >
      Logout
    </button>
  );
}
