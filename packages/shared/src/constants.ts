export const SOLANA_CLUSTERS = {
  MAINNET: "mainnet-beta",
  DEVNET: "devnet",
} as const;

export type SolanaCluster = (typeof SOLANA_CLUSTERS)[keyof typeof SOLANA_CLUSTERS];

export const PROGRAM_IDS = {
  [SOLANA_CLUSTERS.MAINNET]: {
    CROWDFUNDING: "" as string,
    VOTING: "" as string,
  },
  [SOLANA_CLUSTERS.DEVNET]: {
    CROWDFUNDING: "Fg6PaFpoGXkYsidMpWTK6W2BeZ7FEfcYkg476zPFsLnS" as string,
    VOTING: "HmbTLCmaGtYhSJaoxkmD54y4QhhGERbCGMKhbV2V3uEp" as string,
  },
} as const;

export const SOLANA_RPC_URLS = {
  [SOLANA_CLUSTERS.MAINNET]: "https://api.mainnet-beta.solana.com",
  [SOLANA_CLUSTERS.DEVNET]: "https://api.devnet.solana.com",
} as const;

export const VIDEO_CONSTRAINTS = {
  MAX_DURATION_SECONDS: 600, // 10 minutes
  MAX_FILE_SIZE_MB: 500,
  ALLOWED_FORMATS: ["mp4", "webm", "mov"],
} as const;

export const VOTING_CONSTRAINTS = {
  MAX_VOTES_PER_USER: 3,
  MIN_VOTES_FOR_FUNDING: 100,
} as const;

export const CROWDFUNDING_CONSTRAINTS = {
  MIN_GOAL_AMOUNT: 100, // in USD equivalent
  MAX_DURATION_DAYS: 90,
  PLATFORM_FEE_PERCENT: 2.5,
} as const;

export const API_ROUTES = {
  AUTH: {
    REGISTER: "/auth/register",
    LOGIN: "/auth/login",
    WALLET: "/auth/wallet",
  },
  USERS: {
    ME: "/users/me",
    BY_ID: (id: string) => `/users/${id}`,
  },
  VIDEOS: {
    LIST: "/videos",
    TOP: "/videos/top",
    BY_ID: (id: string) => `/videos/${id}`,
  },
  VOTING: {
    VOTE: (videoId: string) => `/voting/${videoId}`,
    LEADERBOARD: "/voting/leaderboard",
    STATUS: (videoId: string) => `/voting/${videoId}/status`,
  },
  CROWDFUNDING: {
    CAMPAIGNS: "/crowdfunding/campaigns",
    BY_ID: (id: string) => `/crowdfunding/campaigns/${id}`,
    CONTRIBUTE: (id: string) => `/crowdfunding/campaigns/${id}/contribute`,
  },
} as const;
