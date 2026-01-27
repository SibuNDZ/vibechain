"use client";

import { useEffect, useState } from "react";
import { VideoCard } from "@/components/video/VideoCard";
import { SemanticSearch } from "@/components/ai/SemanticSearch";
import { RecommendationSection } from "@/components/ai/RecommendationSection";
import { api, Video, PaginatedResponse } from "@/lib/api";

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [sortBy, setSortBy] = useState("votes");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vibechain_token");
    setIsAuthenticated(!!token);
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
      setError(error.message || "Failed to load videos");
      // Show empty state with placeholder if no videos
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-900 py-8">
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

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-white">Trending Videos</h1>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg border border-gray-700 focus:outline-none focus:border-purple-500"
          >
            <option value="votes">Most Voted</option>
            <option value="createdAt">Newest</option>
          </select>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-gray-800 rounded-xl overflow-hidden animate-pulse"
              >
                <div className="aspect-video bg-gray-700" />
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
            <p className="text-gray-400">Be the first to upload a music video!</p>
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
