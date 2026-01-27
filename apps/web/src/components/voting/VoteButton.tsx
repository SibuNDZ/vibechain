"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useAccount } from "wagmi";
import { cn } from "@/lib/utils";

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
    if (!isConnected || voted || isLoading) return;

    setIsLoading(true);
    try {
      await onVote?.(videoId);
      setVotes((v) => v + 1);
      setVoted(true);
    } catch (error) {
      console.error("Vote failed:", error);
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
          ? "bg-purple-600 text-white"
          : "bg-gray-700 text-gray-300 hover:bg-purple-600 hover:text-white",
        (!isConnected || isLoading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <Heart className={cn("w-5 h-5", voted && "fill-current")} />
      <span>{votes.toLocaleString()}</span>
      <span>{voted ? "Voted" : "Vote"}</span>
    </button>
  );
}
