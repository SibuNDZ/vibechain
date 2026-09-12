import Image from "next/image";
import Link from "next/link";
import heroStage from "@/assets/hero-stage.jpg";
import { LAUNCH_APP_HREF } from "./links";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden px-6 pb-20 pt-20 sm:pt-28">
      <div className="pointer-events-none absolute inset-0 bg-landing-wash" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
        <div>
          <h1 className="font-display text-5xl leading-[0.95] tracking-wide text-landing-ink sm:text-6xl lg:text-7xl">
            Music videos owned by the crowd
          </h1>
          <p className="mt-6 max-w-md text-lg text-landing-muted">
            Stream, vote, and fund the next wave of music videos — with every
            contribution recorded on Solana.
          </p>
          <div className="mt-8 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <a
              href={LAUNCH_APP_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-landing-cta px-8 py-3.5 text-base font-semibold text-landing-ink transition hover:shadow-landing-glow"
            >
              Launch App
            </a>
            <Link
              href="/videos"
              className="text-sm font-medium text-landing-muted underline-offset-4 hover:text-landing-ink hover:underline"
            >
              Explore videos
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-6 rounded-[2rem] bg-landing-cta opacity-20 blur-3xl" />
          <Image
            src={heroStage}
            alt="A glowing music-video stage in midnight navy haze"
            className="relative w-full rounded-2xl border border-landing-raised object-cover"
            priority
          />
        </div>
      </div>
    </section>
  );
}
