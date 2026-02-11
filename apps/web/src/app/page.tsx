"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Vote, Coins, TrendingUp, Play, Users } from "lucide-react";
import { FeaturedVideos } from "@/components/video/FeaturedVideos";

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
      <main className="min-h-screen bg-orange-50 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <h2 className="text-5xl font-bold text-slate-900 mb-6">
            Discover. Vote. Fund.
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mb-8">
            The decentralized platform where music videos compete for your votes
            and top creators get crowdfunded by the community.
          </p>
          <div className="flex gap-4">
            <Link
              href="/videos"
              className="px-8 py-3 vc-primary-button rounded-lg text-lg font-semibold transition"
            >
              Explore Videos
            </Link>
            <Link
              href="/crowdfunding"
              className="px-8 py-3 vc-outline-button rounded-lg text-lg font-semibold transition"
            >
              View Campaigns
            </Link>
          </div>
        </section>

        <FeaturedVideos className="pb-12" />

        {/* Feature preview for non-logged-in users */}
        <section className="grid md:grid-cols-3 gap-8 px-6 py-16 max-w-6xl mx-auto">
          <div className="vc-card p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Upload & Share
            </h3>
            <p className="text-slate-600">
              Share your music videos with a global audience and build your fanbase.
            </p>
          </div>
          <div className="vc-card p-6 text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Vote className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Community Voting
            </h3>
            <p className="text-slate-600">
              Vote for your favorite videos. Top voted content enters the funding phase.
            </p>
          </div>
          <div className="vc-card p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Blockchain Funding
            </h3>
            <p className="text-slate-600">
              Transparent crowdfunding powered by smart contracts. Every contribution tracked on-chain.
            </p>
          </div>
        </section>

        <footer className="px-6 pb-12 max-w-6xl mx-auto">
          <div className="border-t border-orange-200 pt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <Link href="/legal" className="hover:text-slate-700">
              Legal
            </Link>
            <Link href="/terms" className="hover:text-slate-700">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-slate-700">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-slate-700">
              Cookies
            </Link>
          </div>
        </footer>
      </main>
    );
  }

  // Homepage for authenticated users
  return (
    <main className="min-h-screen bg-white">
      {/* Welcome Section */}
      <section className="bg-orange-50 px-6 py-12 border-b border-orange-100">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-slate-600">
            What would you like to do today?
          </p>
        </div>
      </section>

      <FeaturedVideos className="py-10" />

      {/* Action Cards */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload & Share Card */}
          <button
            onClick={() => router.push("/upload")}
            className="group vc-card p-8 text-left transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/60"
          >
            <div className="w-16 h-16 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Upload className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Upload & Share
            </h3>
            <p className="text-slate-600 mb-4">
              Share your music videos with a global audience and build your fanbase.
            </p>
            <span className="text-red-600 font-medium group-hover:text-red-700 transition-colors">
              Upload a video →
            </span>
          </button>

          {/* Community Voting Card */}
          <button
            onClick={() => router.push("/videos")}
            className="group vc-card p-8 text-left transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/60"
          >
            <div className="w-16 h-16 bg-orange-100 group-hover:bg-orange-200 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Vote className="w-8 h-8 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Community Voting
            </h3>
            <p className="text-slate-600 mb-4">
              Vote for your favorite videos. Top voted content enters the funding phase.
            </p>
            <span className="text-orange-600 font-medium group-hover:text-orange-700 transition-colors">
              Browse & vote →
            </span>
          </button>

          {/* Blockchain Funding Card */}
          <button
            onClick={() => router.push("/crowdfunding")}
            className="group vc-card p-8 text-left transition-all duration-200 hover:shadow-lg hover:shadow-orange-200/60"
          >
            <div className="w-16 h-16 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Coins className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              Blockchain Funding
            </h3>
            <p className="text-slate-600 mb-4">
              Transparent crowdfunding powered by smart contracts. Support creators you love.
            </p>
            <span className="text-red-600 font-medium group-hover:text-red-700 transition-colors">
              View campaigns →
            </span>
          </button>
        </div>
      </section>

      {/* Quick Stats Section */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <h2 className="text-xl font-semibold text-slate-900 mb-6">Quick Links</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/videos?sort=trending"
            className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors"
          >
            <div className="p-3 bg-orange-200 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Trending</p>
              <p className="text-sm text-slate-500">Hot videos now</p>
            </div>
          </Link>

          <Link
            href="/videos"
            className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors"
          >
            <div className="p-3 bg-red-200 rounded-lg">
              <Play className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">All Videos</p>
              <p className="text-sm text-slate-500">Browse collection</p>
            </div>
          </Link>

          <Link
            href={`/users/${user.id}`}
            className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors"
          >
            <div className="p-3 bg-orange-200 rounded-lg">
              <Users className="w-5 h-5 text-orange-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">My Profile</p>
              <p className="text-sm text-slate-500">View your activity</p>
            </div>
          </Link>

          <Link
            href="/crowdfunding"
            className="flex items-center gap-4 p-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-colors"
          >
            <div className="p-3 bg-red-200 rounded-lg">
              <Coins className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Campaigns</p>
              <p className="text-sm text-slate-500">Support creators</p>
            </div>
          </Link>
        </div>
      </section>

      <footer className="px-6 pb-12 max-w-6xl mx-auto">
        <div className="border-t border-orange-200 pt-6 flex flex-wrap items-center gap-4 text-sm text-slate-500">
          <Link href="/legal" className="hover:text-slate-700">
            Legal
          </Link>
          <Link href="/terms" className="hover:text-slate-700">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-slate-700">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-slate-700">
            Cookies
          </Link>
        </div>
      </footer>

      {/* Ad Space Placeholder */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <div className="bg-orange-50 border border-orange-200 border-dashed rounded-2xl p-8 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-wider mb-2">Advertisement Space</p>
          <p className="text-slate-600">Premium ad placements available for businesses</p>
        </div>
      </section>
    </main>
  );
}
