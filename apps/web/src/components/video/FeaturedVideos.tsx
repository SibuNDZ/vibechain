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
  variant?: "light" | "dark";
}

export function FeaturedVideos({
  className,
  title = "Featured Videos",
  subtitle = "Top voted right now",
  sortBy = "votes",
  limit = 8,
  variant = "light",
}: FeaturedVideosProps) {
  const isDark = variant === "dark";
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
              <TrendingUp className={cn("w-5 h-5", isDark ? "text-primary-400" : "text-red-600")} />
              <h2 className={cn("text-2xl font-semibold", isDark ? "text-white" : "text-slate-900")}>
                {title}
              </h2>
            </div>
            <p className={cn("text-sm mt-1", isDark ? "text-white/60" : "text-slate-600")}>
              {subtitle}
            </p>
          </div>
          <Link
            href="/videos?sortBy=votes"
            className={cn(
              "text-sm font-medium",
              isDark ? "text-primary-400 hover:text-primary-300" : "text-red-600 hover:text-red-700"
            )}
          >
            View all
          </Link>
        </div>

        {error ? (
          <div
            className={cn(
              "p-4 rounded-lg border",
              isDark
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-red-50 border-red-200 text-red-600"
            )}
          >
            {error}
          </div>
        ) : isLoading ? (
          <div className="flex gap-6 overflow-hidden">
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-[260px] animate-pulse"
              >
                <div className={cn("aspect-video rounded-2xl mb-3", isDark ? "bg-white/10" : "bg-orange-100")} />
                <div className={cn("h-4 rounded w-3/4 mb-2", isDark ? "bg-white/10" : "bg-orange-100")} />
                <div className={cn("h-3 rounded w-1/2", isDark ? "bg-white/10" : "bg-orange-100")} />
              </div>
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className={cn("text-center py-10", isDark ? "text-white/50" : "text-slate-500")}>
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
                  <div className={cn("relative aspect-video rounded-2xl overflow-hidden", isDark ? "bg-white/10" : "bg-orange-100")}>
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
                  <div className={cn("mt-3 text-sm font-medium", isDark ? "text-primary-300" : "text-orange-700")}>
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
