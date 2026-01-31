"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Video,
  Heart,
  Settings,
  MessageCircle,
  Wallet,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { api } from "@/lib/api";
import { FollowButton } from "@/components/follows/FollowButton";
import { FollowersList } from "@/components/follows/FollowersList";
import { VideoCard } from "@/components/video/VideoCard";
import { formatDuration, formatAddress, formatRelativeTime } from "@/lib/utils";

interface User {
  id: string;
  username: string;
  email: string | null;
  walletAddress: string | null;
  avatarUrl: string | null;
  bio: string | null;
  createdAt: string;
}

interface VideoData {
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

type TabType = "videos" | "liked" | "activity";

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoData[]>([]);
  const [followCounts, setFollowCounts] = useState<FollowCounts>({
    followers: 0,
    following: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("videos");

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
        const counts = await api.get<FollowCounts>(
          `/users/${userId}/follow-counts`
        );
        setFollowCounts(counts);

        // Fetch user's videos
        const videosResponse = await api.get<{ data: VideoData[] }>(
          `/videos?userId=${userId}`
        );
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

  // Fetch liked videos when tab changes
  useEffect(() => {
    if (activeTab === "liked" && isOwnProfile && likedVideos.length === 0) {
      fetchLikedVideos();
    }
  }, [activeTab, isOwnProfile]);

  const fetchLikedVideos = async () => {
    try {
      const response = await api.get<{ data: VideoData[] }>("/votes/my-votes");
      setLikedVideos(response.data || []);
    } catch (err) {
      console.error("Failed to fetch liked videos:", err);
    }
  };

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
          <Link href="/" className="text-purple-400 hover:text-purple-300">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: "videos" as TabType, label: "Videos", icon: Video, count: videos.length },
    ...(isOwnProfile
      ? [{ id: "liked" as TabType, label: "Liked", icon: Heart, count: likedVideos.length }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
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
              <h1 className="text-3xl font-bold text-white mb-2">
                {user.username}
              </h1>
              {user.bio && (
                <p className="text-gray-300 mb-4 max-w-xl">{user.bio}</p>
              )}

              {/* Meta info */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mb-4 text-sm text-gray-400">
                {user.walletAddress && (
                  <div className="flex items-center gap-1.5">
                    <Wallet className="w-4 h-4" />
                    <span className="font-mono">
                      {formatAddress(user.walletAddress)}
                    </span>
                    <a
                      href={`https://amoy.polygonscan.com/address/${user.walletAddress}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-purple-400"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {formatRelativeTime(user.createdAt)}</span>
                </div>
              </div>

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
                  <span className="text-2xl font-bold text-white block">
                    {videos.length}
                  </span>
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
                <div className="flex items-center justify-center md:justify-start gap-3">
                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Edit Profile
                  </Link>
                  <Link
                    href="/upload"
                    className="flex items-center gap-2 px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Upload Video
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-800 mb-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-3 font-medium transition-colors border-b-2 -mb-px ${
                  activeTab === tab.id
                    ? "text-purple-400 border-purple-400"
                    : "text-gray-400 border-transparent hover:text-white"
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="text-xs bg-gray-800 px-2 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "videos" && (
          <div>
            {videos.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center">
                <Video className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  {isOwnProfile
                    ? "You haven't uploaded any videos yet"
                    : "No videos yet"}
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
                    thumbnailUrl={
                      video.thumbnailUrl || "/placeholder-thumbnail.jpg"
                    }
                    voteCount={video._count?.votes || 0}
                    duration={formatDuration(video.duration)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "liked" && isOwnProfile && (
          <div>
            {likedVideos.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center">
                <Heart className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">
                  You haven't liked any videos yet
                </p>
                <Link
                  href="/videos"
                  className="inline-block mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Explore Videos
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {likedVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    id={video.id}
                    title={video.title}
                    artist={video.user.username}
                    thumbnailUrl={
                      video.thumbnailUrl || "/placeholder-thumbnail.jpg"
                    }
                    voteCount={video._count?.votes || 0}
                    duration={formatDuration(video.duration)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

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
