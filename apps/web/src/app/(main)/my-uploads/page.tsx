"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { api, Video } from "@/lib/api";
import { VideoCardSkeleton } from "@/components/ui/Skeleton";
import { AlertCircle, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";

type StatusInfo = {
  label: string;
  className: string;
};

const statusMap: Record<Video["status"], StatusInfo> = {
  APPROVED: {
    label: "Approved",
    className: "bg-green-100 text-green-700 border border-green-200",
  },
  PENDING: {
    label: "Pending",
    className: "bg-amber-100 text-amber-700 border border-amber-200",
  },
  REJECTED: {
    label: "Rejected",
    className: "bg-red-100 text-red-700 border border-red-200",
  },
};

export default function MyUploadsPage() {
  const router = useRouter();
  const [uploads, setUploads] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("vibechain_token");
    if (!token) {
      router.replace("/login?redirect=/my-uploads");
    } else {
      setIsAuthenticated(true);
    }
  }, [router]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUploads = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await api.get<Video[]>("/videos/mine");
        setUploads(response);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to load uploads";
        setError(message);
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUploads();
  }, [isAuthenticated]);

  const emptyState = useMemo(() => {
    if (isLoading) return null;
    if (uploads.length > 0) return null;
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-slate-900 mb-2">No uploads yet</h2>
        <p className="text-slate-500">Upload your first music video to get started.</p>
      </div>
    );
  }, [isLoading, uploads.length]);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-white py-8">
      <div className="max-w-7xl mx-auto px-6">
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Videos
        </Link>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">My Uploads</h1>
            <p className="text-slate-500 mt-1">
              Pending uploads are visible only to you.
            </p>
          </div>
          <Link
            href="/upload"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 vc-primary-button rounded-lg transition-colors font-medium"
          >
            Upload New
          </Link>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <VideoCardSkeleton key={i} />
            ))}
          </div>
        ) : uploads.length === 0 ? (
          emptyState
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {uploads.map((video) => {
              const status = statusMap[video.status];
              return (
                <Link key={video.id} href={`/videos/${video.id}`} className="group">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-orange-100">
                    <Image
                      src={video.thumbnailUrl || "/placeholder-video.jpg"}
                      alt={video.title}
                      fill
                      className="object-cover transition-transform group-hover:scale-105"
                    />
                    <div
                      className={`absolute top-2 left-2 px-2 py-1 rounded-full text-xs font-medium ${status.className}`}
                    >
                      {status.label}
                    </div>
                  </div>
                  <div className="mt-3">
                    <h3 className="font-semibold text-slate-900 truncate">{video.title}</h3>
                    <p className="text-sm text-slate-500">
                      {video.user?.username || "You"}
                    </p>
                    <div className="mt-1 text-sm text-slate-600">
                      {video._count?.votes?.toLocaleString?.() ?? 0} votes
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
