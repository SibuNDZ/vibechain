"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Video, Users, MessageCircle } from "lucide-react";
import { api } from "@/lib/api";
import { FollowButton } from "@/components/follows/FollowButton";
import { FollowersList } from "@/components/follows/FollowersList";
import { VideoCard } from "@/components/video/VideoCard";
import { formatDuration } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string | null;
  walletAddress: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  duration: number;
  createdAt: string;
  _count?: { votes: number };
  user: { username: string };
}

interface FollowCounts {
  followers: number;
  following: number;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({ followers: 0, following: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Current user state
  const [currentUser, setCurrentUser] = useState<{ id: string } | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);

  // Modal states
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  // Check if viewing own profile
  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    const userData = localStorage.getItem("vibechain_user");
    if (userData) {
      try {
        setCurrentUser(JSON.parse(userData));
      } catch {
        setCurrentUser(null);
      }
    }
  }, []);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Fetch user profile
        const userData = await api.get<User>(`/users/${userId}`);
        setUser(userData);

        // Fetch follow counts
        const counts = await api.get<FollowCounts>(`/users/${userId}/follow-counts`);
        setFollowCounts(counts);

        // Fetch user's videos
        const videosResponse = await api.get<{ data: Video[] }>(`/videos?userId=${userId}`);
        setVideos(videosResponse.data || []);

        // Check follow status if logged in
        const token = localStorage.getItem("vibechain_token");
        if (token && currentUser && currentUser.id !== userId) {
          try {
            const followStatus = await api.get<{ isFollowing: boolean }>(
              `/users/${userId}/follow-status`
            );
            setIsFollowing(followStatus.isFollowing);
          } catch {
            // Ignore follow status errors
          }
        }
      } catch (err) {
        setError("Failed to load user profile");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [userId, currentUser]);

  const handleFollowChange = (following: boolean) => {
    setIsFollowing(following);
    setFollowCounts((prev) => ({
      ...prev,
      followers: following ? prev.followers + 1 : prev.followers - 1,
    }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-32 w-32 rounded-full bg-gray-800 mx-auto mb-4" />
            <div className="h-8 w-48 bg-gray-800 rounded mx-auto mb-2" />
            <div className="h-4 w-64 bg-gray-800 rounded mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error || "User not found"}</p>
          <Link href="/videos" className="text-purple-400 hover:text-purple-300">
            Back to Videos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/videos"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Videos
        </Link>

        {/* Profile Header */}
        <div className="bg-gray-800 rounded-2xl p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
            {/* Avatar */}
            <div className="relative">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.username}
                  className="w-32 h-32 rounded-full object-cover border-4 border-purple-600"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-purple-600 flex items-center justify-center text-white text-4xl font-bold border-4 border-purple-500">
                  {user.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-white mb-2">{user.username}</h1>
              {user.bio && <p className="text-gray-300 mb-4 max-w-xl">{user.bio}</p>}

              {/* Stats */}
              <div className="flex items-center justify-center md:justify-start gap-6 mb-4">
                <button
                  onClick={() => setShowFollowers(true)}
                  className="text-center hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="text-2xl font-bold text-white block">
                    {followCounts.followers}
                  </span>
                  <span className="text-gray-400 text-sm">Followers</span>
                </button>
                <button
                  onClick={() => setShowFollowing(true)}
                  className="text-center hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors"
                >
                  <span className="text-2xl font-bold text-white block">
                    {followCounts.following}
                  </span>
                  <span className="text-gray-400 text-sm">Following</span>
                </button>
                <div className="text-center px-3 py-2">
                  <span className="text-2xl font-bold text-white block">{videos.length}</span>
                  <span className="text-gray-400 text-sm">Videos</span>
                </div>
              </div>

              {/* Action Buttons */}
              {!isOwnProfile && currentUser && (
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <FollowButton
                    userId={userId}
                    isAuthenticated={!!currentUser}
                    currentUserId={currentUser.id}
                    initialIsFollowing={isFollowing}
                    onFollowChange={handleFollowChange}
                    size="lg"
                  />
                  <Link
                    href={`/messages?user=${userId}`}
                    className="flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Message
                  </Link>
                </div>
              )}

              {isOwnProfile && (
                <Link
                  href="/settings"
                  className="inline-block px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Edit Profile
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Videos Section */}
        <div>
          <div className="flex items-center gap-2 mb-6">
            <Video className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">
              {isOwnProfile ? "My Videos" : `${user.username}'s Videos`}
            </h2>
          </div>

          {videos.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center">
              <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">
                {isOwnProfile ? "You haven't uploaded any videos yet" : "No videos yet"}
              </p>
              {isOwnProfile && (
                <Link
                  href="/upload"
                  className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Upload Your First Video
                </Link>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  id={video.id}
                  title={video.title}
                  artist={video.user.username}
                  thumbnailUrl={video.thumbnailUrl || "/placeholder-thumbnail.jpg"}
                  voteCount={video._count?.votes || 0}
                  duration={formatDuration(video.duration)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Followers Modal */}
        {showFollowers && (
          <FollowersList
            userId={userId}
            type="followers"
            onClose={() => setShowFollowers(false)}
            isAuthenticated={!!currentUser}
            currentUserId={currentUser?.id}
          />
        )}

        {/* Following Modal */}
        {showFollowing && (
          <FollowersList
            userId={userId}
            type="following"
            onClose={() => setShowFollowing(false)}
            isAuthenticated={!!currentUser}
            currentUserId={currentUser?.id}
          />
        )}
      </div>
    </div>
  );
}
