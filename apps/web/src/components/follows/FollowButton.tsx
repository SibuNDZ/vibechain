"use client";

import { useState, useEffect } from "react";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { api, FollowStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

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
      // Silent fail for status check - not critical to user experience
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const handleFollow = async () => {
    if (!isAuthenticated || isLoading) return;

    const wasFollowing = isFollowing;
    setIsLoading(true);

    // Optimistic update
    setIsFollowing(!wasFollowing);

    try {
      if (wasFollowing) {
        await api.delete(`/users/${userId}/follow`);
        onFollowChange?.(false);
      } else {
        await api.post(`/users/${userId}/follow`);
        onFollowChange?.(true);
      }
    } catch (error: unknown) {
      // Revert optimistic update on error
      setIsFollowing(wasFollowing);
      const message = error instanceof Error ? error.message : "Failed to update follow status";
      toast.error(message);
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
          "bg-red-600 text-white hover:bg-red-700",
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
          "bg-orange-100 text-orange-400 cursor-wait",
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
          ? "bg-orange-100 text-orange-700 border border-orange-200 hover:bg-red-600 hover:text-white group"
          : "bg-red-600 text-white hover:bg-red-700",
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
