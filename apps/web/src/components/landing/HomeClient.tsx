"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Vote, Coins, TrendingUp, Play, Users } from "lucide-react";
import { FeaturedVideos } from "@/components/video/FeaturedVideos";
import { LandingHome } from "./LandingHome";

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
}

export function HomeClient() {
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

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-landing-bg">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-landing-accent border-t-transparent" />
      </main>
    );
  }

  if (!user) {
    return <LandingHome />;
  }

  return (
    <main className="min-h-screen bg-[#050505]">
      <section className="border-b border-white/10 bg-white/[0.03] px-6 py-12">
        <div className="mx-auto max-w-6xl">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Welcome back, {user.username}!
          </h1>
          <p className="text-white/60">What would you like to do today?</p>
        </div>
      </section>

      <FeaturedVideos variant="dark" className="py-10" />

      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-3">
          <button
            onClick={() => router.push("/upload")}
            className="vc-card group p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary-400/50 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 transition-colors group-hover:bg-primary-500/20">
              <Upload className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Upload & Share</h3>
            <p className="mb-4 text-white/60">
              Share your music videos with a global audience and build your fanbase.
            </p>
            <span className="font-medium text-primary-400 group-hover:text-primary-300">
              Upload a video →
            </span>
          </button>

          <button
            onClick={() => router.push("/videos")}
            className="vc-card group p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary-400/50 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 transition-colors group-hover:bg-primary-500/20">
              <Vote className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Community Voting</h3>
            <p className="mb-4 text-white/60">
              Vote for your favorite videos. Top voted content enters the funding phase.
            </p>
            <span className="font-medium text-primary-400 group-hover:text-primary-300">
              Browse & vote →
            </span>
          </button>

          <button
            onClick={() => router.push("/crowdfunding")}
            className="vc-card group p-8 text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary-400/50 hover:shadow-lg hover:shadow-primary-500/10"
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary-500/10 transition-colors group-hover:bg-primary-500/20">
              <Coins className="h-8 w-8 text-primary-400" />
            </div>
            <h3 className="mb-2 text-xl font-semibold text-white">Blockchain Funding</h3>
            <p className="mb-4 text-white/60">
              Transparent crowdfunding powered by smart contracts. Support creators you love.
            </p>
            <span className="font-medium text-primary-400 group-hover:text-primary-300">
              View campaigns →
            </span>
          </button>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-8">
        <h2 className="mb-6 text-xl font-semibold text-white">Quick Links</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Link
            href="/videos?sort=trending"
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
          >
            <div className="rounded-lg bg-primary-500/10 p-3">
              <TrendingUp className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">Trending</p>
              <p className="text-sm text-white/50">Hot videos now</p>
            </div>
          </Link>
          <Link
            href="/videos"
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
          >
            <div className="rounded-lg bg-primary-500/10 p-3">
              <Play className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">All Videos</p>
              <p className="text-sm text-white/50">Browse collection</p>
            </div>
          </Link>
          <Link
            href={`/users/${user.id}`}
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
          >
            <div className="rounded-lg bg-primary-500/10 p-3">
              <Users className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">My Profile</p>
              <p className="text-sm text-white/50">View your activity</p>
            </div>
          </Link>
          <Link
            href="/crowdfunding"
            className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] p-4 transition-colors hover:bg-white/[0.06]"
          >
            <div className="rounded-lg bg-primary-500/10 p-3">
              <Coins className="h-5 w-5 text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-white">Campaigns</p>
              <p className="text-sm text-white/50">Support creators</p>
            </div>
          </Link>
        </div>
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-12">
        <div className="flex flex-wrap items-center gap-4 border-t border-white/10 pt-6 text-sm text-white/40">
          <Link href="/legal" className="hover:text-white/70">Legal</Link>
          <Link href="/terms" className="hover:text-white/70">Terms</Link>
          <Link href="/privacy" className="hover:text-white/70">Privacy</Link>
          <Link href="/cookies" className="hover:text-white/70">Cookies</Link>
        </div>
      </footer>
    </main>
  );
}
