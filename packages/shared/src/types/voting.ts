import { VideoWithDetails } from "./video";

export interface Vote {
  id: string;
  userId: string;
  videoId: string;
  createdAt: Date;
}

export interface LeaderboardEntry {
  rank: number;
  video: VideoWithDetails;
  voteCount: number;
}

export interface VotingRound {
  id: number;
  startTime: Date;
  endTime: Date;
  finalized: boolean;
  videoIds: string[];
}

export interface VoteStatus {
  videoId: string;
  hasVoted: boolean;
}
