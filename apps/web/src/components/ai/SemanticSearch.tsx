"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X, Loader2 } from "lucide-react";
import Link from "next/link";
import { api, SearchResult } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SafeImage } from "@/components/ui/SafeImage";

interface SemanticSearchProps {
  onResults?: (results: SearchResult[]) => void;
  placeholder?: string;
  className?: string;
}

export function SemanticSearch({
  onResults,
  placeholder = "Search for music videos...",
  className,
}: SemanticSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState("");

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError("");
      try {
        const response = await api.post<{ data: SearchResult[] }>("/ai/search", {
          query: query.trim(),
          limit: 8,
        });
        setResults(response.data);
        setIsOpen(true);
        onResults?.(response.data);
      } catch (err) {
        console.error("Search failed:", err);
        setError("Search failed. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, onResults]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }, []);

  return (
    <div className={cn("relative", className)}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white text-slate-900 pl-12 pr-12 py-3 rounded-xl border border-orange-200 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {(query || isLoading) && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900 transition-colors"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <X className="w-5 h-5" />
            )}
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Results */}
          <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl border border-orange-200 shadow-xl z-50 max-h-[400px] overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-red-600">{error}</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-slate-500">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/videos/${result.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    <div className="relative w-20 h-12 rounded overflow-hidden bg-orange-100 flex-shrink-0">
                      <SafeImage
                        src={result.thumbnailUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                        fallbackSrc="/placeholder-video.jpg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-900 font-medium truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-slate-500 truncate">
                        {result.user.username}
                      </p>
                    </div>
                    <div className="text-xs text-orange-600 flex-shrink-0">
                      {Math.round(result.similarity * 100)}% match
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
