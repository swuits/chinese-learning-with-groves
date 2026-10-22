"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AccountMenu } from "@/components/auth/AccountMenu";

const LINKS = [
  { href: "/learn", label: "Cards" },
  { href: "/quiz", label: "Quiz" },
  { href: "/match", label: "Match" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-3 py-3 sm:gap-3 sm:px-6">
        <Link href="/" className="group flex items-center gap-3" aria-label="Chinese Learning with Groves, home">
          <span
            aria-hidden
            className="grid size-10 place-items-center rounded-lg bg-seal font-hanzi text-xl font-black text-card shadow-[0_3px_0_0_var(--seal-deep)] transition-transform duration-300 group-hover:-rotate-6"
          >
            林
          </span>
          <span className="hidden font-display text-lg font-semibold leading-none tracking-tight sm:block">
            Chinese Learning
            <span className="block text-xs font-medium uppercase tracking-[0.22em] text-bamboo">
              with Groves
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="flex items-center gap-1">
          {LINKS.map(({ href, label }) => {
            const isActive = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={`rounded-full px-2.5 py-1.5 text-sm font-semibold transition-colors sm:px-3.5 ${
                  isActive
                    ? "bg-bamboo-deep text-card"
                    : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </nav>

        <AccountMenu />
      </div>
    </header>
  );
}
