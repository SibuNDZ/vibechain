"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Heart, Calendar, Eye } from "lucide-react";
import { api, Video, FollowCounts } from "@/lib/api";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { VoteButton } from "@/components/voting/VoteButton";
import { CommentSection } from "@/components/comments/CommentSection";
import { FollowButton } from "@/components/follows/FollowButton";
import { FollowersList } from "@/components/follows/FollowersList";

interface VideoDetail extends Video {
  description: string;
}

export default function VideoDetailPage() {
  const params = useParams();
  const videoId = params.id as string;

  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | undefined>();
  const [followCounts, setFollowCounts] = useState<FollowCounts | null>(null);
  const [showFollowers, setShowFollowers] = useState<"followers" | "following" | null>(null);

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem("vibechain_token");
    const userData = localStorage.getItem("vibechain_user");
    if (token && userData) {
      setIsAuthenticated(true);
      try {
        const user = JSON.parse(userData);
        setCurrentUserId(user.id);
      } catch {
        // Ignore parse errors
      }
    }

    fetchVideo();
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      const data = await api.get<VideoDetail>(`/videos/${videoId}`);
      setVideo(data);

      // Fetch follow counts for the video creator
      const counts = await api.get<FollowCounts>(`/users/${data.userId}/follow-counts`);
      setFollowCounts(counts);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Failed to load video");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVote = async () => {
    await api.post(`/videos/${videoId}/vote`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <div className="animate-pulse">
            <div className="aspect-video bg-gray-800 rounded-xl mb-6" />
            <div className="h-8 bg-gray-800 rounded w-1/2 mb-4" />
            <div className="h-4 bg-gray-800 rounded w-1/4 mb-8" />
            <div className="h-32 bg-gray-800 rounded" />
          </div>
        </div>
      </main>
    );
  }

  if (error || !video) {
    return (
      <main className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-6">
          <Link
            href="/videos"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to videos
          </Link>
          <div className="text-center py-16">
            <div className="text-6xl mb-4">404</div>
            <h1 className="text-2xl font-bold text-white mb-2">Video not found</h1>
            <p className="text-gray-400">{error || "This video doesn't exist or has been removed."}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-6">
        {/* Back button */}
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to videos
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video and details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video player */}
            <div className="aspect-video bg-black rounded-xl overflow-hidden">
              <VideoPlayer
                src={video.videoUrl}
                poster={video.thumbnailUrl || undefined}
              />
            </div>

            {/* Video info */}
            <div>
              <h1 className="text-2xl font-bold text-white mb-2">{video.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-400 mb-4">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4" />
                  {video._count.votes.toLocaleString()} votes
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  {formatDate(video.createdAt)}
                </span>
              </div>

              {/* Vote button */}
              <div className="mb-6">
                <VoteButton
                  videoId={video.id}
                  initialVotes={video._count.votes}
                  onVote={handleVote}
                />
              </div>

              {/* Description */}
              {video.description && (
                <div className="bg-gray-800 rounded-xl p-4">
                  <p className="text-gray-300 whitespace-pre-wrap">{video.description}</p>
                </div>
              )}
            </div>

            {/* Comments section */}
            <CommentSection
              videoId={video.id}
              isAuthenticated={isAuthenticated}
              currentUserId={currentUserId}
            />
          </div>

          {/* Sidebar - Artist info */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl p-6 sticky top-8">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
                Artist
              </h3>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-full bg-purple-600 flex items-center justify-center overflow-hidden">
                  {video.user.avatarUrl ? (
                    <img
                      src={video.user.avatarUrl}
                      alt={video.user.username}
                      className="w-16 h-16 object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-white">
                      {video.user.username[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div>
                  <Link
                    href={`/users/${video.user.id}`}
                    className="font-semibold text-white hover:text-purple-400 transition-colors"
                  >
                    {video.user.username}
                  </Link>
                  {followCounts && (
                    <div className="flex items-center gap-3 text-sm text-gray-400 mt-1">
                      <button
                        onClick={() => setShowFollowers("followers")}
                        className="hover:text-purple-400 transition-colors"
                      >
                        {followCounts.followers.toLocaleString()} followers
                      </button>
                      <span>|</span>
                      <button
                        onClick={() => setShowFollowers("following")}
                        className="hover:text-purple-400 transition-colors"
                      >
                        {followCounts.following.toLocaleString()} following
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow button */}
              <FollowButton
                userId={video.user.id}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                size="lg"
                onFollowChange={(isFollowing) => {
                  if (followCounts) {
                    setFollowCounts({
                      ...followCounts,
                      followers: followCounts.followers + (isFollowing ? 1 : -1),
                    });
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Followers/Following modal */}
      {showFollowers && (
        <FollowersList
          userId={video.user.id}
          type={showFollowers}
          isOpen={!!showFollowers}
          onClose={() => setShowFollowers(null)}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
        />
      )}
    </main>
  );
}
