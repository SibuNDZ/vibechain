"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { api, AppNotification } from "@/lib/api";

const POLL_INTERVAL_MS = 45000;

function notificationText(n: AppNotification): string {
  switch (n.type) {
    case "FOLLOW":
      return `${n.actor.username} started following you`;
    case "COMMENT":
      return `${n.actor.username} commented on ${n.video?.title ?? "your video"}`;
    case "MENTION":
      return `${n.actor.username} mentioned you`;
    case "VOTE_MILESTONE":
      return `${n.video?.title ?? "Your video"} hit ${n.metadata?.milestone ?? ""} votes`;
    case "CONTRIBUTION":
      return `${n.actor.username} contributed to ${n.campaign?.video.title ?? "your campaign"}`;
    default:
      return "New notification";
  }
}

function notificationHref(n: AppNotification): string {
  switch (n.type) {
    case "FOLLOW":
      return `/users/${n.actor.id}`;
    case "CONTRIBUTION":
      return n.campaign ? `/videos/${n.campaign.video.id}` : "#";
    case "COMMENT":
    case "MENTION":
    case "VOTE_MILESTONE":
    default:
      return n.video ? `/videos/${n.video.id}` : "#";
  }
}

export function NotificationsBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const { count } = await api.get<{ count: number }>("/notifications/unread-count");
      setUnreadCount(count);
    } catch {
      // Silent -- unread badge just stays stale until the next poll.
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refreshUnreadCount]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const openPanel = async () => {
    const next = !isOpen;
    setIsOpen(next);
    if (!next) return;

    setIsLoadingList(true);
    try {
      const { data } = await api.get<{ data: AppNotification[] }>("/notifications?limit=20");
      setNotifications(data);
    } catch {
      setNotifications([]);
    } finally {
      setIsLoadingList(false);
    }
  };

  const markOneRead = async (n: AppNotification) => {
    if (n.read) return;
    setNotifications((prev) =>
      prev.map((item) => (item.id === n.id ? { ...item, read: true } : item))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    try {
      await api.patch("/notifications/read", { ids: [n.id] });
    } catch {
      // Best-effort; next poll/open reconciles state from the server.
    }
  };

  const markAllRead = async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    try {
      await api.patch("/notifications/read-all");
    } catch {
      // Best-effort; next poll/open reconciles state from the server.
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={openPanel}
        aria-label="Notifications"
        className="relative p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-primary-500 text-white text-[10px] font-semibold">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-[#0A0A0A] border border-white/10 rounded-xl shadow-lg shadow-black/50 py-2 z-50">
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/10">
            <p className="text-white font-medium">Notifications</p>
            {notifications.some((n) => !n.read) && (
              <button
                onClick={markAllRead}
                className="text-xs text-primary-400 hover:text-primary-300 transition-colors"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoadingList ? (
              <div className="px-4 py-6 text-center text-white/50 text-sm">Loading...</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-center text-white/50 text-sm">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <Link
                  key={n.id}
                  href={notificationHref(n)}
                  onClick={() => {
                    setIsOpen(false);
                    markOneRead(n);
                  }}
                  className={cn(
                    "flex items-start gap-3 px-4 py-3 hover:bg-white/10 transition-colors",
                    !n.read && "bg-white/5"
                  )}
                >
                  {!n.read && (
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-primary-400 shrink-0" />
                  )}
                  <div className={cn("flex-1 min-w-0", n.read && "pl-5")}>
                    <p className="text-sm text-white/90">{notificationText(n)}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {formatRelativeTime(n.createdAt)}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
