"use client";

import { useState, useEffect } from "react";
import { Users, X } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  _count: { followers: number };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { page: number; totalPages: number };
}
import { FollowButton } from "./FollowButton";

interface FollowersListProps {
  userId: string;
  type: "followers" | "following";
  onClose: () => void;
  isOpen?: boolean;
  isAuthenticated?: boolean;
  currentUserId?: string;
}

export function FollowersList({
  userId,
  type,
  onClose,
  isOpen = true,
  isAuthenticated = false,
  currentUserId,
}: FollowersListProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async (pageNum = 1) => {
    setIsLoading(true);
    try {
      const endpoint = type === "followers"
        ? `/users/${userId}/followers`
        : `/users/${userId}/following`;

      const response = await api.get<PaginatedResponse<UserProfile>>(endpoint, {
        params: { page: String(pageNum), limit: "20" },
      });

      if (pageNum === 1) {
        setUsers(response.data);
      } else {
        setUsers(prev => [...prev, ...response.data]);
      }

      setHasMore(response.meta.page < response.meta.totalPages);
      setPage(pageNum);
    } catch (error) {
      toast.error(`Failed to load ${type}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (!isLoading && hasMore) {
      fetchUsers(page + 1);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-slate-900/60" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-orange-200">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-slate-900 capitalize">
              {type}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[60vh] p-4">
          {isLoading && users.length === 0 ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-orange-100" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-orange-100 rounded w-24" />
                    <div className="h-3 bg-orange-100 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-orange-200 mx-auto mb-3" />
              <p className="text-slate-500">
                {type === "followers"
                  ? "No followers yet"
                  : "Not following anyone yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3">
                  <a href={`/users/${user.id}`} className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center overflow-hidden">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.username}
                          className="w-10 h-10 object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-white">
                          {user.username[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                  </a>
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/users/${user.id}`}
                      className="font-semibold text-slate-900 hover:text-red-600 truncate block"
                    >
                      {user.username}
                    </a>
                    <p className="text-xs text-slate-500">
                      {user._count.followers} followers
                    </p>
                  </div>
                  <FollowButton
                    userId={user.id}
                    isAuthenticated={isAuthenticated}
                    currentUserId={currentUserId}
                    size="sm"
                  />
                </div>
              ))}

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full py-2 text-orange-600 hover:text-red-600 text-sm font-medium disabled:opacity-50"
                >
                  {isLoading ? "Loading..." : "Load more"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
