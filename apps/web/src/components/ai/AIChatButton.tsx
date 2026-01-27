"use client";

import { useState, useEffect } from "react";
import { Sparkles } from "lucide-react";
import { AIChatModal } from "./AIChatModal";
import { cn } from "@/lib/utils";

export function AIChatButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const token = localStorage.getItem("vibechain_token");
    setIsAuthenticated(!!token);
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40",
          "w-14 h-14 rounded-full",
          "bg-gradient-to-r from-purple-600 to-purple-700",
          "shadow-lg shadow-purple-500/30",
          "flex items-center justify-center",
          "hover:scale-110 hover:shadow-xl hover:shadow-purple-500/40",
          "transition-all duration-200",
          "group"
        )}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />

        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-gray-800 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Ask AI
        </span>
      </button>

      {/* Chat Modal */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
