"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { api, FollowStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
  userId: string;
  isAuthenticated: boolean;
  currentUserId?: string;
  initialIsFollowing?: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: "sm" | "md" | "lg";
}

export function FollowButton({
  userId,
  isAuthenticated,
  currentUserId,
  initialIsFollowing,
  onFollowChange,
  size = "md",
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(initialIsFollowing === undefined);

  // Don't show follow button for own profile
  if (currentUserId === userId) {
    return null;
  }

  useEffect(() => {
    if (isAuthenticated && initialIsFollowing === undefined) {
      checkFollowStatus();
    }
  }, [userId, isAuthenticated]);

  const checkFollowStatus = async () => {
    try {
      const status = await api.get<FollowStatus>(`/users/${userId}/follow-status`);
      setIsFollowing(status.isFollowing);
    } catch (error) {
      console.error("Failed to check follow status:", error);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || isLoading) return;

    setIsLoading(true);
    try {
      if (isFollowing) {
        await api.delete(`/users/${userId}/follow`);
        setIsFollowing(false);
        onFollowChange?.(false);
      } else {
        await api.post(`/users/${userId}/follow`);
        setIsFollowing(true);
        onFollowChange?.(true);
      }
    } catch (error) {
      console.error("Follow action failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <a
        href="/login"
        className={cn(
          "inline-flex items-center gap-2 font-semibold rounded-full transition-all",
          "bg-purple-600 text-white hover:bg-purple-700",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2",
          size === "lg" && "px-6 py-3 text-lg"
        )}
      >
        <UserPlus className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5")} />
        Follow
      </a>
    );
  }

  if (isCheckingStatus) {
    return (
      <button
        disabled
        className={cn(
          "inline-flex items-center gap-2 font-semibold rounded-full transition-all",
          "bg-gray-700 text-gray-400 cursor-wait",
          size === "sm" && "px-3 py-1.5 text-sm",
          size === "md" && "px-4 py-2",
          size === "lg" && "px-6 py-3 text-lg"
        )}
      >
        <Loader2 className={cn("animate-spin", size === "sm" ? "w-4 h-4" : "w-5 h-5")} />
      </button>
    );
  }

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={cn(
        "inline-flex items-center gap-2 font-semibold rounded-full transition-all",
        isFollowing
          ? "bg-gray-700 text-white hover:bg-red-600 hover:text-white group"
          : "bg-purple-600 text-white hover:bg-purple-700",
        isLoading && "opacity-50 cursor-not-allowed",
        size === "sm" && "px-3 py-1.5 text-sm",
        size === "md" && "px-4 py-2",
        size === "lg" && "px-6 py-3 text-lg"
      )}
    >
      {isLoading ? (
        <Loader2 className={cn("animate-spin", size === "sm" ? "w-4 h-4" : "w-5 h-5")} />
      ) : isFollowing ? (
        <>
          <UserMinus className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5", "hidden group-hover:block")} />
          <UserPlus className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5", "group-hover:hidden")} />
          <span className="group-hover:hidden">Following</span>
          <span className="hidden group-hover:inline">Unfollow</span>
        </>
      ) : (
        <>
          <UserPlus className={cn(size === "sm" ? "w-4 h-4" : "w-5 h-5")} />
          Follow
        </>
      )}
    </button>
  );
}
