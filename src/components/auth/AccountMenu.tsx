"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { StatChips } from "@/components/ui/StatChips";
import { useProgress } from "@/lib/progress/store";
import type { SyncStatus } from "@/lib/progress/store-core";
import { useAuth } from "./AuthProvider";

const SYNC_LABEL: Record<SyncStatus, string> = {
  idle: "Progress saved on this device",
  saving: "Saving your progress…",
  saved: "Progress saved to your account",
  error: "Couldn't sync. We'll keep trying.",
};

export function AccountMenu() {
  const { status, account, signOut } = useAuth();

  if (status === "loading") {
    return <div aria-hidden className="size-9 rounded-full bg-paper-deep" />;
  }

  if (!account) {
    return (
      <div className="flex items-center gap-1">
        <Link
          href="/login?mode=signin"
          className="hidden rounded-full px-3.5 py-1.5 text-sm font-semibold text-ink-soft transition-colors hover:bg-paper-deep hover:text-ink sm:block"
        >
          Log in
        </Link>
        <Link
          href="/login"
          className="press whitespace-nowrap rounded-full bg-seal px-3.5 py-1.5 text-sm font-bold text-card"
          style={{ "--press-edge": "var(--seal-deep)" } as React.CSSProperties}
        >
          Join free
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden sm:block">
        <StatChips />
      </div>
      <Menu name={account.name} email={account.email} onSignOut={signOut} />
    </div>
  );
}

interface MenuProps {
  name: string;
  email: string;
  onSignOut: () => Promise<void>;
}

function Menu({ name, email, onSignOut }: MenuProps) {
  const { status: syncStatus } = useProgress();
  const [isOpen, setIsOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent) {
        if (event.key === "Escape") setIsOpen(false);
        return;
      }
      if (root.current && !root.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [isOpen]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await onSignOut();
    setIsOpen(false);
    setIsSigningOut(false);
  };

  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={`Account menu for ${name}`}
        onClick={() => setIsOpen((open) => !open)}
        className="grid size-9 place-items-center rounded-full bg-bamboo-deep font-display text-base font-semibold uppercase text-card transition-transform hover:scale-105"
      >
        {name.charAt(0)}
      </button>

      {isOpen && (
        <div
          role="menu"
          className="pop absolute right-0 top-12 z-40 w-64 origin-top-right rounded-2xl border border-line bg-card p-4 shadow-[var(--shadow-lift)]"
        >
          <p className="truncate font-display text-lg font-semibold">{name}</p>
          <p className="truncate text-sm text-ink-soft">{email}</p>
          <div className="mt-3 sm:hidden">
            <StatChips />
          </div>
          <p
            role="status"
            className={`mt-3 text-xs font-semibold ${syncStatus === "error" ? "text-seal-deep" : "text-ink-soft"}`}
          >
            {SYNC_LABEL[syncStatus]}
          </p>
          <button
            type="button"
            role="menuitem"
            disabled={isSigningOut}
            onClick={handleSignOut}
            className="press mt-4 w-full rounded-xl border border-line bg-paper px-4 py-2.5 text-sm font-bold disabled:opacity-60"
          >
            {isSigningOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
