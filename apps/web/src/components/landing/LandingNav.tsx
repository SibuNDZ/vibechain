"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LAUNCH_APP_HREF } from "./links";

const LINKS = [
  { href: "/#features", label: "Features" },
  { href: "/#how-it-works", label: "How it works" },
  { href: "/about", label: "Docs" },
];

export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-landing-raised/80 bg-landing-bg/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="font-display text-2xl tracking-wide text-landing-ink"
        >
          VibeChain
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-landing-muted hover:text-landing-ink"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href={LAUNCH_APP_HREF}
            className="rounded-lg bg-landing-cta px-4 py-2 text-sm font-semibold text-landing-ink shadow-landing-glow/0 transition hover:shadow-landing-glow"
          >
            Launch App
          </Link>
        </nav>

        <button
          type="button"
          className="text-landing-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-landing-raised px-6 py-4 md:hidden">
          <nav className="flex flex-col gap-3">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-landing-muted hover:text-landing-ink"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href={LAUNCH_APP_HREF}
              onClick={() => setOpen(false)}
              className="rounded-lg bg-landing-cta px-4 py-2 text-center text-sm font-semibold text-landing-ink"
            >
              Launch App
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
