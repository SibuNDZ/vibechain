"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface VoteButtonProps {
  videoId: string;
  initialVotes: number;
  hasVoted?: boolean;
  onVote?: (videoId: string) => Promise<void>;
}

export function VoteButton({
  videoId,
  initialVotes,
  hasVoted = false,
  onVote,
}: VoteButtonProps) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(hasVoted);
  const [isLoading, setIsLoading] = useState(false);
  const { isConnected } = useAccount();

  const handleVote = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet to vote");
      return;
    }

    if (voted || isLoading) return;

    // Optimistic update
    setVotes((v) => v + 1);
    setVoted(true);
    setIsLoading(true);

    try {
      await onVote?.(videoId);
      toast.success("Vote recorded!");
    } catch (error: unknown) {
      // Revert optimistic update on error
      setVotes((v) => v - 1);
      setVoted(false);
      const message = error instanceof Error ? error.message : "Failed to record vote";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleVote}
      disabled={!isConnected || voted || isLoading}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all",
        voted
          ? "bg-red-600 text-white"
          : "bg-orange-100 text-orange-700 hover:bg-red-600 hover:text-white border border-orange-200",
        (!isConnected || isLoading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart className={cn("w-5 h-5", voted && "fill-current")} />
      <span>{votes.toLocaleString()}</span>
      <span>{voted ? "Voted" : "Vote"}</span>
    </button>
  );
}
