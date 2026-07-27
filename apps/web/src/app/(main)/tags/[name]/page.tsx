"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Hash } from "lucide-react";
import { VideoCard } from "@/components/video/VideoCard";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { api, Video, PaginatedResponse } from "@/lib/api";
import toast from "react-hot-toast";

export default function TagPage() {
  const params = useParams();
  const tagName = params.name as string;

  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchVideos();
  }, [tagName]);

  const fetchVideos = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Video>>(
        `/tags/${tagName}/videos`,
        { params: { limit: "20" } }
      );
      setVideos(response.data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      toast.error(error.message || "Failed to load tagged videos");
      setVideos([]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] py-8">
      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to videos
        </Link>

        <div className="flex items-center gap-2 mb-8">
          <Hash className="w-7 h-7 text-primary-400" />
          <h1 className="text-3xl font-bold text-white">{tagName}</h1>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">#</div>
            <h2 className="text-xl font-semibold text-white mb-2">No videos yet</h2>
            <p className="text-white/50">Nothing tagged #{tagName} so far.</p>
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
