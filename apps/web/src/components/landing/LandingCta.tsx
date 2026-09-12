import Link from "next/link";
import { LAUNCH_APP_HREF } from "./links";

export function LandingCta() {
  return (
    <section className="px-6 py-24">
      <div className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-landing-raised bg-landing-surface px-8 py-16 text-center">
        <div className="pointer-events-none absolute inset-0 bg-landing-wash" />
        <div className="relative">
          <h2 className="font-display text-4xl tracking-wide text-landing-ink sm:text-5xl">
            Put the next video on chain
          </h2>
          <p className="mx-auto mt-4 max-w-md text-landing-muted">
            Watch, vote, and fund with a public record. The crowd decides what
            gets made next.
          </p>
          <Link
            href={LAUNCH_APP_HREF}
            className="mt-8 inline-flex rounded-xl bg-landing-cta px-8 py-3.5 text-base font-semibold text-landing-ink transition hover:shadow-landing-glow"
          >
            Launch App
          </Link>
        </div>
      </div>
    </section>
  );
}
