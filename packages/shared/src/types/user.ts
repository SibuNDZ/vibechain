export interface User {
  id: string;
  email?: string;
  username: string;
  walletAddress?: string;
  avatarUrl?: string;
  bio?: string;
  createdAt: Date;
}

export interface UserProfile extends User {
  videoCount: number;
  voteCount: number;
  contributionCount: number;
}

export interface CreateUserInput {
  email?: string;
  username: string;
  password?: string;
  walletAddress?: string;
}
