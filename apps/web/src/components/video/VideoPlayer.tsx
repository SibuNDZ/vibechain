"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import videojs from "video.js";
import type Player from "video.js/dist/types/player";

interface VideoSource {
  src: string;
  type?: string;
  label?: string;
  isAuto?: boolean;
}

interface VideoPlayerProps {
  sources: VideoSource[];
  poster?: string;
  onReady?: (player: Player) => void;
  showQualitySelector?: boolean;
}

export function VideoPlayer({
  sources,
  poster,
  onReady,
  showQualitySelector = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<Player | null>(null);

  const getSourceType = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8")) return "application/x-mpegURL";
    if (lower.includes(".webm")) return "video/webm";
    if (lower.includes(".mov")) return "video/quicktime";
    if (lower.includes(".avi")) return "video/x-msvideo";
    if (lower.includes(".mkv")) return "video/x-matroska";
    return "video/mp4";
  };

  const normalizedSources = useMemo(() => {
    return sources
      .filter((source) => Boolean(source?.src))
      .map((source) => ({
        src: source.src,
        type: source.type || getSourceType(source.src),
        label: source.label,
        isAuto: source.isAuto,
      }));
  }, [sources]);

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (normalizedSources.length === 0) return;
    const preferredIndex = normalizedSources.findIndex(
      (source) =>
        source.isAuto || (source.type || "").toLowerCase().includes("mpegurl")
    );
    const nextIndex = preferredIndex >= 0 ? preferredIndex : 0;
    setSelectedIndex((prev) => (prev === nextIndex ? prev : nextIndex));
  }, [normalizedSources]);

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("video-js", "vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        playsinline: true,
        preload: "auto",
        poster,
        sources: normalizedSources,
      }));

      player.ready(() => {
        onReady?.(player);
      });
    }

    return () => {
      const player = playerRef.current;
      if (player && !player.isDisposed()) {
        player.dispose();
        playerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const player = playerRef.current;
    if (!player || player.isDisposed()) return;
    const activeSource = normalizedSources[selectedIndex] || normalizedSources[0];
    if (activeSource) {
      const currentTime = player.currentTime();
      const wasPaused = player.paused();
      player.src([{ src: activeSource.src, type: activeSource.type }]);
      player.ready(() => {
        if (!Number.isNaN(currentTime)) {
          try {
            player.currentTime(currentTime);
          } catch {
            // Ignore seek errors on source change
          }
        }
        if (!wasPaused) {
          void player.play();
        }
      });
    }
    if (poster) {
      player.poster(poster);
    }
  }, [normalizedSources, selectedIndex, poster]);

  const showSelector = showQualitySelector && normalizedSources.length > 1;

  return (
    <div>
      {showSelector && (
        <div className="mb-2 flex items-center justify-end gap-2">
          {normalizedSources.map((source, index) => (
            <button
              key={`${source.src}-${index}`}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                index === selectedIndex
                  ? "bg-red-600 text-white"
                  : "bg-orange-100 text-orange-700 border border-orange-200 hover:bg-red-600 hover:text-white"
              }`}
            >
              {source.label ||
                ((source.type || "").toLowerCase().includes("mpegurl")
                  ? "Auto"
                  : "Source")}
            </button>
          ))}
        </div>
      )}
      <div data-vjs-player>
        <div ref={videoRef} className="w-full aspect-video rounded-lg overflow-hidden" />
      </div>
    </div>
  );
}
