"use client";

import { useState, useEffect } from "react";
import { Sparkles, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api, RecommendedVideo } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface RecommendationSectionProps {
  className?: string;
}

export function RecommendationSection({ className }: RecommendationSectionProps) {
  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [scrollPosition, setScrollPosition] = useState(0);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await api.get<{ data: RecommendedVideo[] }>(
        "/ai/recommendations",
        { params: { limit: "12" } }
      );
      setRecommendations(response.data);
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
      setError("Failed to load recommendations");
    } finally {
      setIsLoading(false);
    }
  };

  const scroll = (direction: "left" | "right") => {
    const container = document.getElementById("recommendations-scroll");
    if (!container) return;

    const scrollAmount = 300;
    const newPosition =
      direction === "left"
        ? Math.max(0, scrollPosition - scrollAmount)
        : scrollPosition + scrollAmount;

    container.scrollTo({ left: newPosition, behavior: "smooth" });
    setScrollPosition(newPosition);
  };

  if (error) {
    return null;
  }

  return (
    <div className={cn("mb-10", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-600" />
          <h2 className="text-xl font-semibold text-slate-900">For You</h2>
          <span className="text-xs text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
            AI Powered
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchRecommendations}
            disabled={isLoading}
            className="p-2 text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-50"
            title="Refresh recommendations"
          >
            <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
          </button>
          <button
            onClick={() => scroll("left")}
            className="p-2 text-slate-500 hover:text-slate-900 transition-colors hidden sm:block"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="p-2 text-slate-500 hover:text-slate-900 transition-colors hidden sm:block"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      {isLoading ? (
        <div className="flex gap-4 overflow-hidden">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-[200px] animate-pulse"
            >
              <div className="aspect-video bg-orange-100 rounded-lg mb-2" />
              <div className="h-4 bg-orange-100 rounded w-3/4 mb-1" />
              <div className="h-3 bg-orange-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : recommendations.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          <p>No recommendations available yet.</p>
          <p className="text-sm">Vote on some videos to get personalized suggestions!</p>
        </div>
      ) : (
        <div
          id="recommendations-scroll"
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          onScroll={(e) => setScrollPosition(e.currentTarget.scrollLeft)}
        >
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.id} recommendation={rec} />
          ))}
        </div>
      )}
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: RecommendedVideo }) {
  return (
    <Link
      href={`/videos/${recommendation.id}`}
      className="flex-shrink-0 w-[200px] group"
    >
      <div className="relative aspect-video rounded-lg overflow-hidden bg-orange-100 mb-2">
        <SafeImage
          src={recommendation.thumbnailUrl}
          alt={recommendation.title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          fallbackSrc="/placeholder-video.jpg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <h3 className="font-medium text-slate-900 text-sm truncate group-hover:text-orange-600 transition-colors">
        {recommendation.title}
      </h3>
      <p className="text-xs text-slate-500 truncate">{recommendation.user.username}</p>
      <p className="text-xs text-orange-600 mt-1 truncate">{recommendation.reason}</p>
    </Link>
  );
}
