import { User } from "./user";

export enum VideoStatus {
  PENDING = "PENDING",
  APPROVED = "APPROVED",
  REJECTED = "REJECTED",
  FUNDING = "FUNDING",
  FUNDED = "FUNDED",
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
  status: VideoStatus;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface VideoWithDetails extends Video {
  user: Pick<User, "id" | "username" | "avatarUrl">;
  voteCount: number;
}

export interface CreateVideoInput {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration: number;
}

export interface UpdateVideoInput {
  title?: string;
  description?: string;
  thumbnailUrl?: string;
}
