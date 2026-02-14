"use client";

import { Bot, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { AIChatMessage, SearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";

interface ChatMessageProps {
  message: AIChatMessage;
  isStreaming?: boolean;
}

export function ChatMessage({ message, isStreaming }: ChatMessageProps) {
  const isUser = message.role === "user";

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className={cn(
        "flex gap-3",
        isUser ? "flex-row-reverse" : "flex-row"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
          isUser ? "bg-red-600" : "bg-orange-100"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-red-600" />
        )}
      </div>

      {/* Content */}
      <div
        className={cn(
          "flex flex-col max-w-[80%]",
          isUser ? "items-end" : "items-start"
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2",
            isUser
              ? "bg-red-600 text-white rounded-tr-sm"
              : "bg-orange-50 border border-orange-200 text-slate-800 rounded-tl-sm"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-red-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-slate-500 mt-1 px-2">
          {formatTimeAgo(message.createdAt)}
        </span>

        {/* Video recommendations */}
        {message.videos && message.videos.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs text-slate-500 px-2">Recommended videos:</p>
            {message.videos.slice(0, 3).map((video) => (
              <VideoCard key={video.id} video={video} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function VideoCard({ video }: { video: SearchResult }) {
  return (
    <Link
      href={`/videos/${video.id}`}
      className="flex items-center gap-3 p-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
    >
      <div className="relative w-16 h-10 rounded overflow-hidden bg-orange-100 flex-shrink-0">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
            No img
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-900 font-medium truncate">{video.title}</p>
        <p className="text-xs text-slate-500 truncate">{video.user.username}</p>
      </div>
    </Link>
  );
}
