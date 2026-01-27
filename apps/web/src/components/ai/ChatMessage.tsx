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
          isUser ? "bg-purple-600" : "bg-gray-700"
        )}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-purple-400" />
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
              ? "bg-purple-600 text-white rounded-tr-sm"
              : "bg-gray-700 text-gray-100 rounded-tl-sm"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-purple-400 animate-pulse ml-1" />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500 mt-1 px-2">
          {formatTimeAgo(message.createdAt)}
        </span>

        {/* Video recommendations */}
        {message.videos && message.videos.length > 0 && (
          <div className="mt-3 space-y-2 w-full">
            <p className="text-xs text-gray-400 px-2">Recommended videos:</p>
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
      className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors"
    >
      <div className="relative w-16 h-10 rounded overflow-hidden bg-gray-700 flex-shrink-0">
        {video.thumbnailUrl ? (
          <Image
            src={video.thumbnailUrl}
            alt={video.title}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-500 text-xs">
            No img
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white font-medium truncate">{video.title}</p>
        <p className="text-xs text-gray-400 truncate">{video.user.username}</p>
      </div>
    </Link>
  );
}
