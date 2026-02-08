"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, Vote, Coins, TrendingUp, Play, Users } from "lucide-react";

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
    const token = localStorage.getItem("vibechain_token");
    const userData = localStorage.getItem("vibechain_user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    }
    setIsLoading(false);
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </main>
    );
  }

  // Landing page for non-authenticated users
  if (!user) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center">
          <h2 className="text-5xl font-bold text-white mb-6">
            Discover. Vote. Fund.
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mb-8">
            The decentralized platform where music videos compete for your votes
            and top creators get crowdfunded by the community.
          </p>
          <div className="flex gap-4">
            <Link
              href="/videos"
              className="px-8 py-3 bg-purple-600 text-white rounded-lg text-lg font-semibold hover:bg-purple-700 transition"
            >
              Explore Videos
            </Link>
            <Link
              href="/crowdfunding"
              className="px-8 py-3 border border-purple-500 text-purple-300 rounded-lg text-lg font-semibold hover:bg-purple-900/50 transition"
            >
              View Campaigns
            </Link>
          </div>
        </section>

        {/* Feature preview for non-logged-in users */}
        <section className="grid md:grid-cols-3 gap-8 px-6 py-16 max-w-6xl mx-auto">
          <div className="bg-gray-800/50 p-6 rounded-xl text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Upload & Share
            </h3>
            <p className="text-gray-400">
              Share your music videos with a global audience and build your fanbase.
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Vote className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Community Voting
            </h3>
            <p className="text-gray-400">
              Vote for your favorite videos. Top voted content enters the funding phase.
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl text-center">
            <div className="w-16 h-16 bg-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Coins className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Blockchain Funding
            </h3>
            <p className="text-gray-400">
              Transparent crowdfunding powered by smart contracts. Every contribution tracked on-chain.
            </p>
          </div>
        </section>

        <footer className="px-6 pb-12 max-w-6xl mx-auto">
          <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <Link href="/legal" className="hover:text-gray-200">
              Legal
            </Link>
            <Link href="/terms" className="hover:text-gray-200">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-gray-200">
              Privacy
            </Link>
            <Link href="/cookies" className="hover:text-gray-200">
              Cookies
            </Link>
          </div>
        </footer>
      </main>
    );
  }

  // Homepage for authenticated users
  return (
    <main className="min-h-screen bg-gray-900">
      {/* Welcome Section */}
      <section className="bg-gradient-to-r from-purple-900/50 to-gray-900 px-6 py-12">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.username}!
          </h1>
          <p className="text-gray-400">
            What would you like to do today?
          </p>
        </div>
      </section>

      {/* Action Cards */}
      <section className="px-6 py-12 max-w-6xl mx-auto">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Upload & Share Card */}
          <button
            onClick={() => router.push("/upload")}
            className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 p-8 rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-16 h-16 bg-purple-600/20 group-hover:bg-purple-600/30 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Upload className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Upload & Share
            </h3>
            <p className="text-gray-400 mb-4">
              Share your music videos with a global audience and build your fanbase.
            </p>
            <span className="text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
              Upload a video →
            </span>
          </button>

          {/* Community Voting Card */}
          <button
            onClick={() => router.push("/videos")}
            className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 p-8 rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-16 h-16 bg-purple-600/20 group-hover:bg-purple-600/30 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Vote className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Community Voting
            </h3>
            <p className="text-gray-400 mb-4">
              Vote for your favorite videos. Top voted content enters the funding phase.
            </p>
            <span className="text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
              Browse & vote →
            </span>
          </button>

          {/* Blockchain Funding Card */}
          <button
            onClick={() => router.push("/crowdfunding")}
            className="group bg-gray-800 hover:bg-gray-750 border border-gray-700 hover:border-purple-500 p-8 rounded-2xl text-left transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10"
          >
            <div className="w-16 h-16 bg-purple-600/20 group-hover:bg-purple-600/30 rounded-full flex items-center justify-center mb-6 transition-colors">
              <Coins className="w-8 h-8 text-purple-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              Blockchain Funding
            </h3>
            <p className="text-gray-400 mb-4">
              Transparent crowdfunding powered by smart contracts. Support creators you love.
            </p>
            <span className="text-purple-400 font-medium group-hover:text-purple-300 transition-colors">
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
            className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <div className="p-3 bg-orange-500/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <p className="font-medium text-white">Trending</p>
              <p className="text-sm text-gray-400">Hot videos now</p>
            </div>
          </Link>

          <Link
            href="/videos"
            className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Play className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="font-medium text-white">All Videos</p>
              <p className="text-sm text-gray-400">Browse collection</p>
            </div>
          </Link>

          <Link
            href={`/users/${user.id}`}
            className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <div className="p-3 bg-purple-500/20 rounded-lg">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-white">My Profile</p>
              <p className="text-sm text-gray-400">View your activity</p>
            </div>
          </Link>

          <Link
            href="/crowdfunding"
            className="flex items-center gap-4 p-4 bg-gray-800/50 hover:bg-gray-800 rounded-xl transition-colors"
          >
            <div className="p-3 bg-green-500/20 rounded-lg">
              <Coins className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="font-medium text-white">Campaigns</p>
              <p className="text-sm text-gray-400">Support creators</p>
            </div>
          </Link>
        </div>
      </section>

      <footer className="px-6 pb-12 max-w-6xl mx-auto">
        <div className="border-t border-gray-800 pt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400">
          <Link href="/legal" className="hover:text-gray-200">
            Legal
          </Link>
          <Link href="/terms" className="hover:text-gray-200">
            Terms
          </Link>
          <Link href="/privacy" className="hover:text-gray-200">
            Privacy
          </Link>
          <Link href="/cookies" className="hover:text-gray-200">
            Cookies
          </Link>
        </div>
      </footer>

      {/* Ad Space Placeholder */}
      <section className="px-6 py-8 max-w-6xl mx-auto">
        <div className="bg-gradient-to-r from-gray-800 to-gray-800/50 border border-gray-700 border-dashed rounded-2xl p-8 text-center">
          <p className="text-gray-500 text-sm uppercase tracking-wider mb-2">Advertisement Space</p>
          <p className="text-gray-400">Premium ad placements available for businesses</p>
        </div>
      </section>
    </main>
  );
}
