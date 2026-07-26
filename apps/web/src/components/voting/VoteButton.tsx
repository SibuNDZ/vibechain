"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
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
  const { connected } = useWallet();

  const handleVote = async () => {
    if (!connected) {
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
      disabled={!connected || voted || isLoading}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-full font-semibold transition-all",
        voted
          ? "bg-gradient-to-r from-primary-400 to-primary-700 text-white"
          : "bg-white/10 text-white/70 hover:bg-gradient-to-r hover:from-primary-400 hover:to-primary-700 hover:text-white border border-white/10",
        (!connected || isLoading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart className={cn("w-5 h-5", voted && "fill-current")} />
      <span>{votes.toLocaleString()}</span>
      <span>{voted ? "Voted" : "Vote"}</span>
    </button>
  );
}
