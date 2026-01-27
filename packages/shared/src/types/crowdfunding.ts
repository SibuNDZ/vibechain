import { User } from "./user";
import { VideoWithDetails } from "./video";

export enum CampaignStatus {
  ACTIVE = "ACTIVE",
  SUCCESSFUL = "SUCCESSFUL",
  FAILED = "FAILED",
  CANCELLED = "CANCELLED",
}

export interface Campaign {
  id: string;
  videoId: string;
  goalAmount: number;
  raisedAmount: number;
  contractAddress?: string;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignWithDetails extends Campaign {
  video: VideoWithDetails;
  backerCount: number;
  daysLeft: number;
  progressPercent: number;
}

export interface Contribution {
  id: string;
  campaignId: string;
  userId: string;
  amount: number;
  txHash: string;
  createdAt: Date;
}

export interface ContributionWithUser extends Contribution {
  user: Pick<User, "id" | "username" | "avatarUrl">;
}

export interface CreateCampaignInput {
  goalAmount: number;
  endDate: string;
  contractAddress?: string;
}

export interface RecordContributionInput {
  amount: number;
  txHash: string;
}
