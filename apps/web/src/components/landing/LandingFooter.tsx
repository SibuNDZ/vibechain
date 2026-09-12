import Link from "next/link";
import { GITHUB_HREF } from "./links";

export function LandingFooter() {
  return (
    <footer className="border-t border-landing-raised px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
        <p className="font-display text-xl tracking-wide text-landing-ink">
          VibeChain
        </p>
        <nav className="flex flex-wrap gap-5 text-sm text-landing-muted">
          <Link href="/#features" className="hover:text-landing-ink">
            Features
          </Link>
          <Link href="/about" className="hover:text-landing-ink">
            Docs
          </Link>
          <a
            href={GITHUB_HREF}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-landing-ink"
          >
            GitHub
          </a>
          <Link href="/legal" className="hover:text-landing-ink">
            Legal
          </Link>
        </nav>
      </div>
      <p className="mx-auto mt-8 max-w-6xl text-xs text-landing-muted">
        © {new Date().getFullYear()} VibeChain
      </p>
    </footer>
  );
}
