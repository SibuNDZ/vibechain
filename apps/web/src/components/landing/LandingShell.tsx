import { ReactNode } from "react";
import { LandingFooter } from "./LandingFooter";
import { LandingNav } from "./LandingNav";

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div className="landing -mt-16 min-h-screen bg-landing-bg font-barlow text-landing-ink">
      <LandingNav />
      {children}
      <LandingFooter />
    </div>
  );
}
