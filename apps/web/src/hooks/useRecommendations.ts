import { useState, useEffect, useCallback } from "react";
import { api, RecommendedVideo } from "@/lib/api";

interface UseRecommendationsOptions {
  limit?: number;
  autoFetch?: boolean;
}

export function useRecommendations(options: UseRecommendationsOptions = {}) {
  const { limit = 20, autoFetch = true } = options;

  const [recommendations, setRecommendations] = useState<RecommendedVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecommendations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Check if user is authenticated
      const token = localStorage.getItem("vibechain_token");

      const endpoint = token ? "/ai/recommendations" : "/ai/recommendations/anonymous";
      const response = await api.get<{ data: RecommendedVideo[] }>(endpoint, {
        params: { limit: String(limit) },
      });

      setRecommendations(response.data);
      return response.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load recommendations";
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

  const getSimilarVideos = useCallback(async (videoId: string, count = 10) => {
    try {
      const response = await api.get<{ data: RecommendedVideo[] }>(
        `/ai/recommendations/similar/${videoId}`,
        { params: { limit: String(count) } }
      );
      return response.data;
    } catch {
      return [];
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
  }, [autoFetch, fetchRecommendations]);

  return {
    recommendations,
    isLoading,
    error,
    refresh: fetchRecommendations,
    getSimilarVideos,
  };
}
