import { useState, useCallback } from "react";
import { api, SearchResult } from "@/lib/api";

interface UseSemanticSearchOptions {
  limit?: number;
  threshold?: number;
}

export function useSemanticSearch(options: UseSemanticSearchOptions = {}) {
  const { limit = 20, threshold = 0.5 } = options;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (query: string) => {
      if (!query.trim()) {
        setResults([]);
        return [];
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await api.post<{ data: SearchResult[] }>("/ai/search", {
          query: query.trim(),
          limit,
          threshold,
        });
        setResults(response.data);
        return response.data;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Search failed";
        setError(errorMessage);
        return [];
      } finally {
        setIsLoading(false);
      }
    },
    [limit, threshold]
  );

  const clear = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    search,
    results,
    isLoading,
    error,
    clear,
  };
}
