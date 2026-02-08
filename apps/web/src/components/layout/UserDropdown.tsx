"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { User, Video, Settings, LogOut, ChevronDown, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserDropdownProps {
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  onLogout: () => void;
  isAdmin?: boolean;
}

export function UserDropdown({ user, onLogout, isAdmin = false }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-orange-100 transition-colors"
      >
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center text-white font-semibold">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-slate-900 font-medium hidden sm:block">{user.username}</span>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-slate-500 transition-transform",
            isOpen && "rotate-180"
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white border border-orange-200 rounded-xl shadow-lg py-2 z-50">
          <div className="px-4 py-2 border-b border-orange-200">
            <p className="text-slate-900 font-medium">{user.username}</p>
            <p className="text-slate-500 text-sm">View your profile</p>
          </div>

          <Link
            href={`/users/${user.id}`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-orange-100 hover:text-slate-900 transition-colors"
          >
            <User className="w-4 h-4" />
            My Profile
          </Link>

          <Link
            href={`/users/${user.id}?tab=videos`}
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-orange-100 hover:text-slate-900 transition-colors"
          >
            <Video className="w-4 h-4" />
            My Videos
          </Link>

          <Link
            href="/settings"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-orange-100 hover:text-slate-900 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>

          {isAdmin && (
            <Link
              href="/admin/insights"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-slate-600 hover:bg-orange-100 hover:text-slate-900 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
              Admin Insights
            </Link>
          )}

          <div className="border-t border-orange-200 mt-2 pt-2">
            <button
              onClick={() => {
                setIsOpen(false);
                onLogout();
              }}
              className="flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-orange-100 hover:text-red-700 transition-colors w-full"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
