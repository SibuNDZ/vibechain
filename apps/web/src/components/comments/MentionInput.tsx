"use client";

import { useEffect, useRef, useState } from "react";
import { api, MentionSuggestion } from "@/lib/api";

interface MentionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Ranked candidates (follows > video owner > thread commenters), highest priority first. */
  suggestions: MentionSuggestion[];
  /** Called on keydown when no mention dropdown is open, so callers can keep e.g. Enter-to-submit. */
  onKeyDownWhenIdle?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

interface ActiveMention {
  query: string;
  startIndex: number;
}

export function findActiveMention(value: string, cursor: number): ActiveMention | null {
  const uptoCursor = value.slice(0, cursor);
  const at = uptoCursor.lastIndexOf("@");
  if (at === -1) return null;

  const between = uptoCursor.slice(at + 1);
  if (!/^[a-z0-9_]*$/i.test(between)) return null;

  const before = uptoCursor[at - 1];
  if (before !== undefined && !/\s/.test(before)) return null;

  return { query: between, startIndex: at };
}

export function MentionInput({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  suggestions,
  onKeyDownWhenIdle,
}: MentionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [mention, setMention] = useState<ActiveMention | null>(null);
  const [searchResults, setSearchResults] = useState<MentionSuggestion[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!mention || mention.query.length === 0) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const response = await api.get<{ data: MentionSuggestion[] }>("/users/search", {
          params: { q: mention.query, limit: "8" },
        });
        setSearchResults(response.data);
      } catch {
        setSearchResults([]);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [mention?.query]);

  const results = (() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    const local = suggestions.filter((s) => s.username.toLowerCase().startsWith(q));
    const seen = new Set(local.map((s) => s.id));
    const merged = [...local];
    for (const r of searchResults) {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        merged.push(r);
      }
    }
    return merged.slice(0, 8);
  })();

  const isOpen = mention !== null && mention.query.length > 0 && results.length > 0;

  const selectMention = (username: string) => {
    if (!mention) return;
    const input = inputRef.current;
    const cursor = input?.selectionStart ?? value.length;
    const before = value.slice(0, mention.startIndex);
    const after = value.slice(cursor);
    const next = `${before}@${username} ${after}`;
    onChange(next);
    setMention(null);
    setActiveIndex(0);

    requestAnimationFrame(() => {
      const pos = before.length + username.length + 2;
      input?.setSelectionRange(pos, pos);
      input?.focus();
    });
  };

  const handleChangeOrSelect = () => {
    const input = inputRef.current;
    if (!input) return;
    const cursor = input.selectionStart ?? 0;
    setMention(findActiveMention(input.value, cursor));
    setActiveIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      onKeyDownWhenIdle?.(e);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      selectMention(results[activeIndex].username);
    } else if (e.key === "Escape") {
      setMention(null);
    }
  };

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          handleChangeOrSelect();
        }}
        onKeyUp={handleChangeOrSelect}
        onClick={handleChangeOrSelect}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-1 w-64 bg-[#0A0A0A] border border-white/10 rounded-lg shadow-lg shadow-black/50 py-1 z-50 max-h-64 overflow-y-auto">
          {results.map((user, i) => (
            <button
              key={user.id}
              type="button"
              onClick={() => selectMention(user.username)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm transition-colors ${
                i === activeIndex ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5"
              }`}
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <span className="w-6 h-6 rounded-full bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-xs font-semibold text-white">
                  {user.username[0]?.toUpperCase()}
                </span>
              )}
              {user.username}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
