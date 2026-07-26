"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Vote, Coins, TrendingUp, Play, Users, UploadCloud, Trophy, Gift } from "lucide-react";
import { FeaturedVideos } from "@/components/video/FeaturedVideos";
import { FadeIn } from "@/components/ui/FadeIn";

const FEATURES = [
  {
    icon: TrendingUp,
    title: "Discover",
    description: "Explore thousands of music videos from emerging and established artists.",
  },
  {
    icon: Vote,
    title: "Vote",
    description: "Vote for your favorite videos and influence what gets funded next.",
  },
  {
    icon: Coins,
    title: "Fund",
    description: "Support creators directly through transparent, on-chain crowdfunding.",
  },
];

const HOW_IT_WORKS = [
  { icon: UploadCloud, title: "Upload", description: "Artists submit their music videos." },
  { icon: Vote, title: "Community Votes", description: "Users vote for their favorites." },
  { icon: Trophy, title: "Get Funded", description: "Top videos receive crowdfunding." },
  { icon: Gift, title: "Earn Rewards", description: "Voters and creators share the success." },
];

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem("vibechain_token");
      const userData = localStorage.getItem("vibechain_user");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    window.addEventListener("storage", checkAuth);
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-400 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <main className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
        {/* ── Hero ─────────────────────────────────────────── */}
        <section className="relative px-6 pt-28 pb-20 sm:pt-36 sm:pb-28">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 50% 0%, rgba(56,189,248,0.15) 0%, transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0 pointer-events-none opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />

          <div className="relative max-w-4xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight mb-6">
              Discover. Vote.{" "}
              <span className="bg-gradient-to-r from-primary-400 to-primary-700 bg-clip-text text-transparent">
                Fund.
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-white/60 max-w-xl mx-auto mb-10 leading-relaxed">
              The decentralized platform where music videos compete for your votes
              and top creators get crowdfunded by the community.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 sm:mb-20">
              <Link
                href="/videos"
                className="px-8 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-primary-400 to-primary-700 shadow-[0_4px_24px_rgba(56,189,248,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                Explore Videos
              </Link>
              <Link
                href="/crowdfunding"
                className="px-8 py-4 rounded-xl text-base font-semibold border border-white/30 hover:border-primary-400 hover:bg-primary-500/10 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
              >
                View Campaigns
              </Link>
            </div>

            {/* Floating video mockup */}
            <div className="relative max-w-2xl mx-auto rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-2 shadow-2xl shadow-primary-500/10">
              <div className="relative aspect-video rounded-xl bg-gradient-to-br from-[#0A0A0A] to-[#111827] flex items-center justify-center overflow-hidden">
                <div
                  className="absolute inset-0 opacity-20"
                  style={{
                    backgroundImage: "radial-gradient(rgba(56,189,248,0.5) 1px, transparent 1px)",
                    backgroundSize: "24px 24px",
                  }}
                />
                <button
                  aria-label="Play preview"
                  className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-[0_0_40px_rgba(56,189,248,0.5)] hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400 focus-visible:ring-offset-2 focus-visible:ring-offset-black"
                >
                  <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white ml-1" />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────── */}
        <FadeIn>
          <section className="px-6 py-20 max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
              Why Choose VibeChain
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <div
                  key={title}
                  className="group p-10 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md transition-all duration-300 hover:border-primary-400/50 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(56,189,248,0.15)]"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary-500/10 flex items-center justify-center mb-6 group-hover:bg-primary-500/20 transition-colors">
                    <Icon className="w-7 h-7 text-primary-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{title}</h3>
                  <p className="text-white/60 leading-relaxed">{description}</p>
                </div>
              ))}
            </div>
          </section>
        </FadeIn>

        {/* ── Trending Videos ──────────────────────────────── */}
        <FadeIn>
          <FeaturedVideos
            variant="dark"
            title="Trending Now"
            subtitle="What the community is voting for right now"
            className="py-16"
          />
        </FadeIn>

        {/* ── How It Works ─────────────────────────────────── */}
        <FadeIn>
          <section className="px-6 py-20 bg-[#0A0A0A] border-y border-white/5">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-16">
                How It Works
              </h2>
              <div className="relative grid grid-cols-2 md:grid-cols-4 gap-y-12 gap-x-6">
                <div
                  className="hidden md:block absolute left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-primary-400/0 via-primary-500 to-primary-700/0"
                  style={{ top: "28px" }}
                />
                {HOW_IT_WORKS.map(({ icon: Icon, title, description }, i) => (
                  <div key={title} className="relative flex flex-col items-center text-center">
                    <div className="relative z-10 w-14 h-14 rounded-full bg-[#0A0A0A] border-2 border-primary-500 flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6 text-primary-400" />
                    </div>
                    <p className="text-xs font-semibold text-primary-400 mb-1">
                      STEP {i + 1}
                    </p>
                    <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
                    <p className="text-sm text-white/50">{description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </FadeIn>

        {/* ── CTA ──────────────────────────────────────────── */}
        <FadeIn>
          <section
            className="px-6 py-24 text-center"
            style={{
              background: "linear-gradient(to bottom, #050505, rgba(2,132,199,0.08))",
            }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Shape the Future of Music?
            </h2>
            <p className="text-white/60 max-w-md mx-auto mb-8">
              Join thousands of artists and fans on the platform.
            </p>
            <Link
              href="/register"
              className="inline-flex px-10 py-4 rounded-xl text-base font-semibold bg-gradient-to-r from-primary-400 to-primary-700 shadow-[0_4px_24px_rgba(56,189,248,0.3)] hover:brightness-110 hover:scale-[1.02] transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
            >
              Get Started Free
            </Link>
            <p className="text-xs text-white/40 mt-4">No credit card required</p>
          </section>
        </FadeIn>

        {/* ── Footer ───────────────────────────────────────── */}
        <footer className="border-t border-white/10 bg-[#050505] px-6 py-16">
          <div className="max-w-6xl mx-auto grid sm:grid-cols-2 md:grid-cols-4 gap-10">
            <div>
              <span className="text-lg font-bold text-white">VibeChain</span>
              <p className="text-sm text-white/50 mt-2 max-w-[220px]">
                Discover, vote, and fund the next big music videos.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Platform</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/videos" className="hover:text-primary-400 transition-colors">Discover</Link></li>
                <li><Link href="/crowdfunding" className="hover:text-primary-400 transition-colors">Campaigns</Link></li>
                <li><Link href="/upload" className="hover:text-primary-400 transition-colors">Upload</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-white/60">
                <li><Link href="/legal" className="hover:text-primary-400 transition-colors">Legal</Link></li>
                <li><Link href="/terms" className="hover:text-primary-400 transition-colors">Terms</Link></li>
                <li><Link href="/privacy" className="hover:text-primary-400 transition-colors">Privacy</Link></li>
                <li><Link href="/cookies" className="hover:text-primary-400 transition-colors">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white mb-3">Stay Updated</h4>
              <form
                className="flex gap-2"
                onSubmit={(e) => e.preventDefault()}
              >
                <input
                  type="email"
                  placeholder="you@example.com"
                  className="min-w-0 flex-1 px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary-400 focus-visible:ring-2 focus-visible:ring-primary-400"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-primary-400 to-primary-700 hover:brightness-110 transition"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-12 pt-6 border-t border-white/10 text-sm text-white/40">
            © {new Date().getFullYear()} VibeChain. All rights reserved.
          </div>
        </footer>
      </main>
    );
  }

  // Homepage for authenticated users
  return (
    <main className="min-h-screen bg-[#050505]">
      {/* Welcome Section */}
      <section className="bg-white/[0.03] px-6 py-12 border-b border-white/10">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-white/60">
            What would you like to do today?
          </p>
        </div>
      </section>

      <FeaturedVideos variant="dark" className="py-10" />

      {/* Action Cards */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload & Share Card */}
          <button
            onClick={() => router.push("/upload")}
            className="group vc-card p-8 text-left transition-all duration-200 hover:border-primary-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="w-16 h-16 bg-primary-500/10 group-hover:bg-primary-500/20 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Upload className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Upload & Share
            </h3>
            <p className="text-white/60 mb-4">
              Share your music videos with a global audience and build your fanbase.
            </p>
            <span className="text-primary-400 font-medium group-hover:text-primary-300 transition-colors">
              Upload a video →
            </span>
          </button>

          {/* Community Voting Card */}
          <button
            onClick={() => router.push("/videos")}
            className="group vc-card p-8 text-left transition-all duration-200 hover:border-primary-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="w-16 h-16 bg-primary-500/10 group-hover:bg-primary-500/20 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Vote className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Community Voting
            </h3>
            <p className="text-white/60 mb-4">
              Vote for your favorite videos. Top voted content enters the funding phase.
            </p>
            <span className="text-primary-400 font-medium group-hover:text-primary-300 transition-colors">
              Browse & vote →
            </span>
          </button>

          {/* Blockchain Funding Card */}
          <button
            onClick={() => router.push("/crowdfunding")}
            className="group vc-card p-8 text-left transition-all duration-200 hover:border-primary-400/50 hover:-translate-y-1 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="w-16 h-16 bg-primary-500/10 group-hover:bg-primary-500/20 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Coins className="w-8 h-8 text-primary-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Blockchain Funding
            </h3>
            <p className="text-white/60 mb-4">
              Transparent crowdfunding powered by smart contracts. Support creators you love.
            </p>
            <span className="text-primary-400 font-medium group-hover:text-primary-300 transition-colors">
              View campaigns →
            </span>
          </button>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-white mb-6">Quick Links</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/videos?sort=trending"
            className="flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-colors"
          >
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">Trending</p>
              <p className="text-sm text-white/50">Hot videos now</p>
            </div>
          </Link>

          <Link
            href="/videos"
            className="flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-colors"
          >
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <Play className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">All Videos</p>
              <p className="text-sm text-white/50">Browse collection</p>
            </div>
          </Link>

          <Link
            href={`/users/${user.id}`}
            className="flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-colors"
          >
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <Users className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">My Profile</p>
              <p className="text-sm text-white/50">View your activity</p>
            </div>
          </Link>

          <Link
            href="/crowdfunding"
            className="flex items-center gap-4 p-4 bg-white/[0.03] hover:bg-white/[0.06] border border-white/10 rounded-xl transition-colors"
          >
            <div className="p-3 bg-primary-500/10 rounded-lg">
              <Coins className="w-5 h-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">Campaigns</p>
              <p className="text-sm text-white/50">Support creators</p>
            </div>
          </Link>
        </div>
      </section>

      <footer className="px-6 pb-12 max-w-6xl mx-auto">
        <div className="border-t border-white/10 pt-6 flex flex-wrap items-center gap-4 text-sm text-white/40">
          <Link href="/legal" className="hover:text-white/70">
            Legal
          </Link>
          <Link href="/terms" className="hover:text-white/70">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-white/70">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-white/70">
            Cookies
          </Link>
        </div>
      </footer>

      {/* Ad Space Placeholder */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <div className="bg-white/[0.03] border border-white/10 border-dashed rounded-2xl p-8 text-center">
          <p className="text-white/40 text-sm uppercase tracking-wider mb-2">Advertisement Space</p>
          <p className="text-white/60">Premium ad placements available for businesses</p>
        </div>
      </section>
    </main>
  );
}
