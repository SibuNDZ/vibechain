export const SUPPORTED_CHAINS = {
  POLYGON: 137,
  POLYGON_AMOY: 80002,
} as const;

export const CONTRACT_ADDRESSES = {
  [SUPPORTED_CHAINS.POLYGON]: {
    CROWDFUNDING: "" as `0x${string}`,
    VOTING: "" as `0x${string}`,
  },
  [SUPPORTED_CHAINS.POLYGON_AMOY]: {
    CROWDFUNDING: "0x049a85B23dCba662A66644eaf982F04A34aec095" as `0x${string}`,
    VOTING: "" as `0x${string}`,
  },
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
