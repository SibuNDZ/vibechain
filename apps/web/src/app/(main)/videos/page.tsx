"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Hash } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";
import { SemanticSearch } from "@/components/ai/SemanticSearch";
import { RecommendationSection } from "@/components/ai/RecommendationSection";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { api, Video, PaginatedResponse, TrendingTag } from "@/lib/api";
import toast from "react-hot-toast";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [trendingTags, setTrendingTags] = useState<TrendingTag[]>([]);

  useEffect(() => {
    const token = localStorage.getItem("vibechain_token");
    setIsAuthenticated(!!token);
  }, []);

  useEffect(() => {
    api
      .get<{ data: TrendingTag[] }>("/tags/trending")
      .then((res) => setTrendingTags(res.data))
      .catch(() => setTrendingTags([]));
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [sortBy]);

  const fetchVideos = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<PaginatedResponse<Video>>("/videos", {
        params: { sortBy, limit: "20" },
      });
      setVideos(response.data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage = error.message || "Failed to load videos";
      setError(errorMessage);
      toast.error(errorMessage);
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] py-8">
      <div className="max-w-7xl mx-auto px-6">
        {/* Search Bar */}
        <div className="mb-8">
          <SemanticSearch
            placeholder="Search for music videos using AI..."
            className="max-w-2xl mx-auto"
          />
        </div>

        {/* Personalized Recommendations */}
        {isAuthenticated && <RecommendationSection className="mb-8" />}

        {/* Trending Tags */}
        {trendingTags.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-8">
            <span className="flex items-center gap-1 text-white/50 text-sm mr-1">
              <Hash className="w-4 h-4" />
              Trending:
            </span>
            {trendingTags.map((tag) => (
              <Link
                key={tag.id}
                href={`/tags/${tag.name}`}
                className="px-3 py-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm text-white/80 hover:text-white transition-colors"
              >
                #{tag.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Trending Videos</h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white/5 text-white px-4 py-2 rounded-lg border border-white/10 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
          >
            <option value="votes" className="bg-[#0A0A0A]">Most Voted</option>
            <option value="createdAt" className="bg-[#0A0A0A]">Newest</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
            <p className="text-white/50">Be the first to upload a music video!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {videos.map((video) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                artist={video.user.username}
                thumbnailUrl={video.thumbnailUrl || "/placeholder-video.jpg"}
                voteCount={video._count.votes}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
