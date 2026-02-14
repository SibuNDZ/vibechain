"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { api, PaginatedResponse, Video } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface FeaturedVideosProps {
  className?: string;
  title?: string;
  subtitle?: string;
  sortBy?: "votes" | "createdAt";
  limit?: number;
}

export function FeaturedVideos({
  className,
  title = "Featured Videos",
  subtitle = "Top voted right now",
  sortBy = "votes",
  limit = 8,
}: FeaturedVideosProps) {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchFeatured = async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.get<PaginatedResponse<Video>>("/videos", {
          params: { sortBy, limit: String(limit) },
        });
        setVideos(response.data);
      } catch (err: unknown) {
        const error = err as { message?: string };
        setError(error.message || "Failed to load featured videos");
        setVideos([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFeatured();
  }, [limit, sortBy]);

  return (
    <section className={cn("px-6", className)}>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-red-600" />
              <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
            </div>
            <p className="text-sm text-slate-600 mt-1">{subtitle}</p>
          </div>
          <Link
            href="/videos?sortBy=votes"
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            View all
          </Link>
        </div>

        {error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[260px] animate-pulse"
              >
                <div className="aspect-video bg-orange-100 rounded-2xl mb-3" />
                <div className="h-4 bg-orange-100 rounded w-3/4 mb-2" />
                <div className="h-3 bg-orange-100 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-10 text-slate-500">
            No featured videos yet.
          </div>
        ) : (
          <div className="vc-featured-track flex gap-6 overflow-x-auto scrollbar-hide pb-6">
            {videos.map((video, index) => (
              <Link
                key={video.id}
                href={`/videos/${video.id}`}
                className="flex-shrink-0 w-[260px] group"
              >
                <div
                  className="vc-featured-card vc-float-card"
                  style={{ animationDelay: `${index * 0.2}s` }}
                >
                  <div className="relative aspect-video rounded-2xl overflow-hidden bg-orange-100">
                    <SafeImage
                      src={video.thumbnailUrl}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      fallbackSrc="/placeholder-video.jpg"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent opacity-80" />
                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <h3 className="font-semibold text-sm truncate">
                        {video.title}
                      </h3>
                      <p className="text-xs text-white/80 truncate">
                        {video.user.username}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 text-sm text-orange-700 font-medium">
                    {video._count.votes.toLocaleString()} votes
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
