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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-white/5 text-white placeholder-white/30 pl-12 pr-12 py-3 rounded-xl border border-white/10 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30 transition-all"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {(query || isLoading) && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
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
          <div className="absolute top-full left-0 right-0 mt-2 bg-[#0A0A0A] rounded-xl border border-white/10 shadow-xl shadow-black/50 z-50 max-h-[400px] overflow-y-auto">
            {error ? (
              <div className="p-4 text-center text-red-400">{error}</div>
            ) : results.length === 0 ? (
              <div className="p-4 text-center text-white/50">
                No results found for "{query}"
              </div>
            ) : (
              <div className="p-2">
                {results.map((result) => (
                  <Link
                    key={result.id}
                    href={`/videos/${result.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="relative w-20 h-12 rounded overflow-hidden bg-white/10 flex-shrink-0">
                      <SafeImage
                        src={result.thumbnailUrl}
                        alt={result.title}
                        fill
                        className="object-cover"
                        fallbackSrc="/placeholder-video.jpg"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {result.title}
                      </p>
                      <p className="text-sm text-white/50 truncate">
                        {result.user.username}
                      </p>
                    </div>
                    <div className="text-xs text-primary-400 flex-shrink-0">
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
