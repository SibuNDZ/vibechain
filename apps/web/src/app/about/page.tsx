import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/ui/FadeIn";
import { LandingShell } from "@/components/landing/LandingShell";
import { LAUNCH_APP_HREF } from "@/components/landing/links";

export const metadata: Metadata = {
  title: "About & Docs — VibeChain",
  description:
    "How VibeChain voting, crowdfunding, and Solana wallet sign-in work, and how to get started.",
};

const SECTIONS = [
  {
    title: "What VibeChain is",
    body: "VibeChain is a music-video platform where the crowd decides what gets attention and funding. Artists upload videos. Viewers vote. Top videos can open a crowdfunding campaign whose contributions are recorded on Solana.",
  },
  {
    title: "Voting rules",
    body: "Each account has a limited number of votes so a single wallet cannot dominate the board. Votes are stored with your account. Pending uploads are not public and cannot be voted on until a platform admin approves them.",
  },
  {
    title: "Crowdfunding rules",
    body: "A campaign has a goal, a deadline, and a public contribution list. Supporters send SOL from a connected wallet. After the transaction confirms, VibeChain records the signature. Successful campaigns can be claimed by the creator minus a small platform fee. Failed campaigns can be refunded.",
  },
  {
    title: "Technology",
    body: "The web app is Next.js. The API is NestJS with Postgres. Media goes through Cloudinary. Wallets use the Solana adapter (Phantom and Solflare). Email/password sign-in is also available. Crowdfunding programs are written in Anchor for Solana.",
  },
];

export default function AboutPage() {
  return (
    <LandingShell>
      <article className="mx-auto max-w-3xl px-6 py-20">
        <p className="text-sm font-medium text-landing-accent">Docs</p>
        <h1 className="mt-3 font-display text-5xl tracking-wide text-landing-ink">
          How VibeChain works
        </h1>
        <p className="mt-5 text-lg text-landing-muted">
          A short guide to the product, the rules, and how to start. No token
          sale pitch — just how the platform is built.
        </p>

        <div className="mt-14 space-y-12">
          {SECTIONS.map((section) => (
            <FadeIn key={section.title}>
              <section>
                <h2 className="font-display text-3xl tracking-wide text-landing-ink">
                  {section.title}
                </h2>
                <p className="mt-4 leading-relaxed text-landing-muted">
                  {section.body}
                </p>
              </section>
            </FadeIn>
          ))}

          <FadeIn>
            <section>
              <h2 className="font-display text-3xl tracking-wide text-landing-ink">
                Get started
              </h2>
              <ol className="mt-4 list-decimal space-y-3 pl-5 text-landing-muted">
                <li>Create an account or connect a Solana wallet.</li>
                <li>
                  <Link href="/videos" className="text-landing-accent hover:underline">
                    Explore videos
                  </Link>{" "}
                  and vote on work you want funded.
                </li>
                <li>Artists upload from the app. New videos stay under review until approved.</li>
                <li>Support an active campaign from the crowdfunding board.</li>
              </ol>
              <Link
                href={LAUNCH_APP_HREF}
                className="mt-8 inline-flex rounded-xl bg-landing-cta px-8 py-3.5 text-base font-semibold text-landing-ink transition hover:shadow-landing-glow"
              >
                Launch App
              </Link>
            </section>
          </FadeIn>
        </div>
      </article>
    </LandingShell>
  );
}
