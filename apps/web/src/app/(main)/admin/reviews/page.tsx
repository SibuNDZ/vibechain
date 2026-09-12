"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, ShieldAlert } from "lucide-react";
import { api, PaginatedResponse, Video } from "@/lib/api";
import { SafeImage } from "@/components/ui/SafeImage";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import toast from "react-hot-toast";

export default function AdminReviewsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [unauthorized, setUnauthorized] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  const fetchPending = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<PaginatedResponse<Video>>(
        "/videos/admin/pending",
        { params: { limit: "50" } }
      );
      setVideos(response.data);
    } catch (err: unknown) {
      const status = (err as { statusCode?: number }).statusCode;
      if (status === 401 || status === 403) {
        setUnauthorized(true);
      } else {
        toast.error((err as { message?: string }).message || "Failed to load queue");
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const review = async (id: string, approve: boolean) => {
    setReviewingId(id);
    try {
      await api.post(`/videos/${id}/${approve ? "approve" : "reject"}`);
      setVideos((prev) => prev.filter((video) => video.id !== id));
      toast.success(approve ? "Video is now live" : "Video rejected");
    } catch (err: unknown) {
      toast.error((err as { message?: string }).message || "Review failed");
    } finally {
      setReviewingId(null);
    }
  };

  if (unauthorized) {
    return (
      <main className="min-h-screen bg-[#050505] py-16 px-6">
        <div className="max-w-xl mx-auto text-center">
          <ShieldAlert className="w-10 h-10 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Admin only</h1>
          <p className="text-white/50">You do not have access to the review queue.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#050505] py-8">
      <div className="max-w-5xl mx-auto px-6">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-white/50 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to videos
        </Link>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Review queue</h1>
          <p className="text-white/50">
            Approve a submission to publish it. Rejected videos stay private to the uploader.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 text-white/50">
            <Clock className="w-8 h-8 mx-auto mb-3" />
            No videos waiting for review.
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((video) => (
              <div
                key={video.id}
                className="vc-card p-4 flex flex-col sm:flex-row gap-4"
              >
                <Link
                  href={`/videos/${video.id}`}
                  className="relative w-full sm:w-56 aspect-video rounded-lg overflow-hidden bg-white/10 shrink-0"
                >
                  <SafeImage
                    src={video.thumbnailUrl}
                    alt={video.title}
                    fill
                    className="object-cover"
                    fallbackSrc="/placeholder-video.jpg"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/videos/${video.id}`}
                    className="text-lg font-semibold text-white hover:text-primary-400"
                  >
                    {video.title}
                  </Link>
                  <p className="text-sm text-white/50 mt-1">
                    {video.user.username}
                  </p>
                  <p className="text-xs text-amber-300 mt-2">Video under review</p>
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => review(video.id, true)}
                      disabled={reviewingId === video.id}
                      className="px-4 py-2 vc-primary-button rounded-lg text-sm font-semibold disabled:opacity-50"
                    >
                      Approve and publish
                    </button>
                    <button
                      onClick={() => review(video.id, false)}
                      disabled={reviewingId === video.id}
                      className="px-4 py-2 bg-white/5 border border-white/10 text-white rounded-lg text-sm font-semibold hover:bg-white/10 disabled:opacity-50"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
