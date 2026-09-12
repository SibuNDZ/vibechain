"use client";

import { FadeIn } from "@/components/ui/FadeIn";
import { LandingCta } from "./LandingCta";
import { LandingFaq } from "./LandingFaq";
import { LandingFeatures } from "./LandingFeatures";
import { LandingHero } from "./LandingHero";
import { LandingHowItWorks } from "./LandingHowItWorks";
import { LandingLeaderboard } from "./LandingLeaderboard";
import { LandingShell } from "./LandingShell";
import { LandingStats } from "./LandingStats";

export function LandingHome() {
  return (
    <LandingShell>
      <LandingHero />
      <FadeIn>
        <LandingStats />
      </FadeIn>
      <FadeIn>
        <LandingFeatures />
      </FadeIn>
      <FadeIn>
        <LandingHowItWorks />
      </FadeIn>
      <FadeIn>
        <LandingLeaderboard />
      </FadeIn>
      <FadeIn>
        <LandingFaq />
      </FadeIn>
      <FadeIn>
        <LandingCta />
      </FadeIn>
    </LandingShell>
  );
}
