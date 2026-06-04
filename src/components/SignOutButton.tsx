"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className="text-xs text-[var(--slr-muted)] hover:text-[var(--slr-ink)] transition-colors"
    >
      Sign out
    </button>
  );
}
