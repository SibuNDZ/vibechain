const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

interface ApiError {
  message: string;
  statusCode: number;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("vibechain_token");
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { params, headers: customHeaders, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;
    if (params) {
      const searchParams = new URLSearchParams(params);
      url += `?${searchParams.toString()}`;
    }

    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(customHeaders as Record<string, string>),
    };

    // Add auth token if available and not already set
    if (token && !headers.Authorization) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    // Handle empty responses (204 No Content)
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const error: ApiError = {
        message: data.message || `API Error: ${response.status}`,
        statusCode: response.status,
      };
      throw error;
    }

    return data;
  }

  get<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "GET" });
  }

  post<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  patch<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  put<T>(endpoint: string, data?: unknown, options?: RequestOptions) {
    return this.request<T>(endpoint, {
      ...options,
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  delete<T>(endpoint: string, options?: RequestOptions) {
    return this.request<T>(endpoint, { ...options, method: "DELETE" });
  }

  // Streaming method for AI chat
  async *stream(endpoint: string, data: unknown): AsyncGenerator<string> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Stream request failed: ${response.status}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error("Response body is not readable");
    }

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        yield decoder.decode(value, { stream: true });
      }
    } finally {
      reader.releaseLock();
    }
  }
}

export const api = new ApiClient(API_BASE_URL);

// Type definitions for API responses
export interface Video {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  userId: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  _count: {
    votes: number;
  };
}

export interface Campaign {
  id: string;
  videoId: string;
  goalAmount: number;
  raisedAmount: number;
  status: "ACTIVE" | "SUCCESSFUL" | "FAILED" | "CANCELLED";
  deadline: string;
  contractCampaignId: number | null;
  createdAt: string;
  video: {
    id: string;
    title: string;
    thumbnailUrl: string | null;
    user: {
      id: string;
      username: string;
    };
  };
  _count: {
    contributions: number;
  };
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  videoId: string;
  parentId: string | null;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  replies?: Comment[];
  _count?: {
    replies: number;
  };
}

export interface UserProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  _count: {
    followers: number;
    videos: number;
  };
}

export interface FollowCounts {
  followers: number;
  following: number;
}

export interface FollowStatus {
  isFollowing: boolean;
}

// AI-related types
export interface SearchResult extends Video {
  similarity: number;
}

export interface AIChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  videos?: SearchResult[];
  createdAt: string;
}

export interface ChatConversation {
  id: string;
  title: string | null;
  createdAt: string;
  updatedAt: string;
  messages: AIChatMessage[];
}

export interface RecommendedVideo extends SearchResult {
  reason: string;
  score: number;
}

export interface StreamChunk {
  type: "content" | "videos" | "done" | "error";
  content?: string;
  videos?: SearchResult[];
  messageId?: string;
  error?: string;
}
