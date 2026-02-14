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
          "bg-gradient-to-r from-red-600 to-orange-500",
          "shadow-lg shadow-orange-500/30",
          "flex items-center justify-center",
          "hover:scale-110 hover:shadow-xl hover:shadow-orange-500/40",
          "transition-all duration-200",
          "group"
        )}
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-white group-hover:animate-pulse" />

        {/* Tooltip */}
        <span className="absolute right-full mr-3 px-3 py-1.5 bg-white border border-orange-200 text-slate-700 text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-sm">
          Ask AI
        </span>
      </button>

      {/* Chat Modal */}
      <AIChatModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}
