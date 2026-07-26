"use client";

import { useState, useEffect, useMemo, FormEvent } from "react";
import Link from "next/link";
import { MessageCircle, Send, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { api, Comment, MentionSuggestion, PaginatedResponse } from "@/lib/api";
import { cn } from "@/lib/utils";
import { MentionInput } from "./MentionInput";
import toast from "react-hot-toast";

interface CommentSectionProps {
  videoId: string;
  isAuthenticated: boolean;
  currentUserId?: string;
  videoOwner?: { id: string; username: string; avatarUrl: string | null };
}

export function CommentSection({
  videoId,
  isAuthenticated,
  currentUserId,
  videoOwner,
}: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [loadedReplies, setLoadedReplies] = useState<Record<string, Comment[]>>({});
  const [following, setFollowing] = useState<MentionSuggestion[]>([]);

  useEffect(() => {
    fetchComments();
  }, [videoId]);

  useEffect(() => {
    if (!isAuthenticated || !currentUserId) {
      setFollowing([]);
      return;
    }

    api
      .get<PaginatedResponse<MentionSuggestion>>(`/users/${currentUserId}/following`, {
        params: { limit: "50" },
      })
      .then((res) => setFollowing(res.data))
      .catch(() => setFollowing([]));
  }, [isAuthenticated, currentUserId]);

  // Ranked mention candidates: follows > video owner > everyone else who has
  // commented on this thread, self excluded, deduped keeping first (highest
  // priority) occurrence.
  const mentionSuggestions = useMemo(() => {
    const threadCommenters = comments.flatMap((c) => [
      c.user,
      ...(c.replies?.map((r) => r.user) || []),
    ]);

    const candidates = [
      ...following,
      ...(videoOwner ? [videoOwner] : []),
      ...threadCommenters,
    ];

    const seen = new Set<string>();
    const ranked: MentionSuggestion[] = [];
    for (const user of candidates) {
      if (user.id === currentUserId || seen.has(user.id)) continue;
      seen.add(user.id);
      ranked.push(user);
    }
    return ranked;
  }, [following, videoOwner, comments, currentUserId]);

  const fetchComments = async () => {
    try {
      const response = await api.get<PaginatedResponse<Comment>>(
        `/videos/${videoId}/comments`
      );
      setComments(response.data);
    } catch (error) {
      toast.error("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitComment = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const comment = await api.post<Comment>(`/videos/${videoId}/comments`, {
        content: newComment.trim(),
      });
      setComments([comment, ...comments]);
      setNewComment("");
      toast.success("Comment posted!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to post comment";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!replyContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const reply = await api.post<Comment>(`/videos/${videoId}/comments`, {
        content: replyContent.trim(),
        parentId,
      });

      // Add reply to the comment's replies
      setComments(comments.map(comment => {
        if (comment.id === parentId) {
          return {
            ...comment,
            replies: [...(comment.replies || []), reply],
            _count: {
              ...comment._count,
              replies: (comment._count?.replies || 0) + 1,
            },
          };
        }
        return comment;
      }));

      setReplyContent("");
      setReplyingTo(null);
      toast.success("Reply posted!");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to post reply";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string, parentId?: string | null) => {
    try {
      await api.delete(`/comments/${commentId}`);

      if (parentId) {
        // Remove from replies
        setComments(comments.map(comment => {
          if (comment.id === parentId) {
            return {
              ...comment,
              replies: comment.replies?.filter(r => r.id !== commentId),
              _count: {
                ...comment._count,
                replies: Math.max((comment._count?.replies || 1) - 1, 0),
              },
            };
          }
          return comment;
        }));

        // Also remove from loaded replies
        setLoadedReplies(prev => ({
          ...prev,
          [parentId]: (prev[parentId] || []).filter(r => r.id !== commentId),
        }));
      } else {
        setComments(comments.filter(c => c.id !== commentId));
      }
      toast.success("Comment deleted");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to delete comment";
      toast.error(message);
    }
  };

  const loadMoreReplies = async (commentId: string) => {
    try {
      const response = await api.get<PaginatedResponse<Comment>>(
        `/comments/${commentId}/replies`
      );
      setLoadedReplies(prev => ({
        ...prev,
        [commentId]: response.data,
      }));
      setExpandedReplies(prev => new Set([...prev, commentId]));
    } catch (error) {
      toast.error("Failed to load replies");
    }
  };

  const toggleReplies = (commentId: string) => {
    if (expandedReplies.has(commentId)) {
      setExpandedReplies(prev => {
        const next = new Set(prev);
        next.delete(commentId);
        return next;
      });
    } else {
      loadMoreReplies(commentId);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  // Renders @mentions as profile links, driven only by the comment's stored
  // CommentMention rows -- never re-parses arbitrary @text, and never injects
  // raw HTML. Links route by id so they survive the mentioned user renaming.
  const renderCommentContent = (comment: Comment) => {
    if (!comment.mentions || comment.mentions.length === 0) {
      return comment.content;
    }

    const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const usernameToId = new Map(
      comment.mentions.map((m) => [m.mentionedUser.username, m.mentionedUserId])
    );
    const pattern = new RegExp(
      `@(${[...usernameToId.keys()].map(escapeRegex).join("|")})(?![a-z0-9_])`,
      "g"
    );

    const nodes: React.ReactNode[] = [];
    let lastIndex = 0;
    let key = 0;

    for (const match of comment.content.matchAll(pattern)) {
      const [full, username] = match;
      const index = match.index ?? 0;
      if (index > lastIndex) {
        nodes.push(comment.content.slice(lastIndex, index));
      }
      const userId = usernameToId.get(username);
      nodes.push(
        <Link
          key={`mention-${key++}`}
          href={`/users/${userId}`}
          className="text-primary-400 hover:underline"
        >
          {full}
        </Link>
      );
      lastIndex = index + full.length;
    }
    if (lastIndex < comment.content.length) {
      nodes.push(comment.content.slice(lastIndex));
    }

    return nodes;
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => {
    const replies = loadedReplies[comment.id] || comment.replies || [];
    const replyCount = comment._count?.replies || 0;
    const isExpanded = expandedReplies.has(comment.id);
    const canDelete = currentUserId === comment.userId;

    return (
      <div className={cn("flex gap-3", isReply && "ml-8 mt-3")}>
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center flex-shrink-0">
          {comment.user.avatarUrl ? (
            <img
              src={comment.user.avatarUrl}
              alt={comment.user.username}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <span className="text-sm font-semibold text-white">
              {comment.user.username[0].toUpperCase()}
            </span>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white text-sm">
              {comment.user.username}
            </span>
            <span className="text-white/40 text-xs">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
          <p className="text-white/80 text-sm mt-1">{renderCommentContent(comment)}</p>

          <div className="flex items-center gap-4 mt-2">
            {isAuthenticated && !isReply && (
              <button
                onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                className="text-white/50 text-xs hover:text-primary-400 transition-colors"
              >
                Reply
              </button>
            )}
            {canDelete && (
              <button
                onClick={() => handleDeleteComment(comment.id, comment.parentId)}
                className="text-white/50 text-xs hover:text-red-400 transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
            )}
          </div>

          {/* Reply input */}
          {replyingTo === comment.id && (
            <div className="mt-3 flex gap-2">
              <MentionInput
                value={replyContent}
                onChange={setReplyContent}
                placeholder="Write a reply..."
                suggestions={mentionSuggestions}
                className="w-full bg-white/5 text-white text-sm rounded-lg px-3 py-2 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
                onKeyDownWhenIdle={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitReply(comment.id);
                  }
                }}
              />
              <button
                onClick={() => handleSubmitReply(comment.id)}
                disabled={isSubmitting || !replyContent.trim()}
                className="vc-primary-button px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Show replies */}
          {!isReply && replyCount > 0 && (
            <button
              onClick={() => toggleReplies(comment.id)}
              className="text-primary-400 text-xs mt-2 flex items-center gap-1 hover:text-primary-300"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Hide replies
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  View {replyCount} {replyCount === 1 ? "reply" : "replies"}
                </>
              )}
            </button>
          )}

          {/* Replies list */}
          {isExpanded && replies.length > 0 && (
            <div className="mt-2">
              {replies.map((reply) => (
                <CommentItem key={reply.id} comment={reply} isReply />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="vc-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <MessageCircle className="w-5 h-5 text-primary-400" />
        <h2 className="text-xl font-semibold text-white">
          Comments {comments.length > 0 && `(${comments.length})`}
        </h2>
      </div>

      {/* New comment form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmitComment} className="mb-6">
          <div className="flex gap-3">
            <MentionInput
              value={newComment}
              onChange={setNewComment}
              placeholder="Add a comment..."
              suggestions={mentionSuggestions}
              className="w-full bg-white/5 text-white placeholder-white/30 rounded-lg px-4 py-3 border border-white/10 focus:outline-none focus:ring-2 focus:ring-primary-400/30 focus:border-primary-400"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="vc-primary-button px-6 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-4 h-4" />
              Post
            </button>
          </div>
        </form>
      ) : (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-lg text-center">
          <p className="text-white/60">
            Please{" "}
            <a href="/login" className="text-primary-400 hover:underline">
              sign in
            </a>{" "}
            to leave a comment
          </p>
        </div>
      )}

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex gap-3 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-white/10 rounded w-24" />
                <div className="h-3 bg-white/10 rounded w-3/4" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8">
          <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/50">No comments yet. Be the first to comment!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {comments.map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  );
}
