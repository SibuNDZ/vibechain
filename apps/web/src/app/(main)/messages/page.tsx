"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ArrowLeft, Search, Plus } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface OtherUser {
  id: string;
  username: string;
  avatarUrl: string | null;
}

interface Conversation {
  id: string;
  otherUser: OtherUser;
  lastMessage: {
    content: string;
    createdAt: string;
    isOwn: boolean;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function MessagesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Handle starting new conversation from user profile
  useEffect(() => {
    const userIdParam = searchParams?.get("user");
    if (userIdParam) {
      startNewConversation(userIdParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const token = localStorage.getItem("vibechain_token");
    if (!token) {
      router.replace("/login?redirect=/messages");
      return;
    }
    fetchConversations();
  }, [router]);

  const fetchConversations = async () => {
    try {
      const response = await api.get<{ data: Conversation[] }>(
        "/messages/conversations"
      );
      setConversations(response.data);
    } catch (err) {
      toast.error("Failed to load conversations");
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = async (userId: string) => {
    try {
      const response = await api.get<{ id: string }>(
        `/messages/user/${userId}`
      );
      router.replace(`/messages/${response.id}`);
    } catch (err) {
      toast.error("Failed to start conversation");
    }
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.otherUser.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-48 bg-orange-100 rounded" />
            <div className="h-12 bg-orange-100 rounded-lg" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-orange-100 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link
              href="/videos"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-orange-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-2xl font-bold text-slate-900">Messages</h1>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-12 pr-4 py-3 bg-white border border-orange-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
          />
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="vc-card p-12 text-center">
            <MessageCircle className="w-12 h-12 text-orange-200 mx-auto mb-4" />
            <p className="text-slate-600 mb-2">
              {searchQuery ? "No conversations found" : "No messages yet"}
            </p>
            <p className="text-slate-500 text-sm">
              Start a conversation from someone's profile
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv) => (
              <Link
                key={conv.id}
                href={`/messages/${conv.id}`}
                className="flex items-center gap-4 p-4 bg-orange-50 border border-orange-200 hover:bg-orange-100 rounded-xl transition-colors"
              >
                {/* Avatar */}
                {conv.otherUser.avatarUrl ? (
                  <img
                    src={conv.otherUser.avatarUrl}
                    alt={conv.otherUser.username}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
                    {conv.otherUser.username.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900">
                      {conv.otherUser.username}
                    </span>
                    {conv.lastMessage && (
                      <span className="text-xs text-slate-500">
                        {formatTimeAgo(conv.lastMessage.createdAt)}
                      </span>
                    )}
                  </div>
                  {conv.lastMessage && (
                    <p className="text-sm text-slate-600 truncate">
                      {conv.lastMessage.isOwn && (
                        <span className="text-slate-500">You: </span>
                      )}
                      {conv.lastMessage.content}
                    </p>
                  )}
                </div>

                {/* Unread Badge */}
                {conv.unreadCount > 0 && (
                  <span className="px-2 py-1 bg-red-600 text-white text-xs font-medium rounded-full">
                    {conv.unreadCount}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
