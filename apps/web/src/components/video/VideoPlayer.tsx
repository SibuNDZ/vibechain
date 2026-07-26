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
  const [resolvedPoster, setResolvedPoster] = useState<string | undefined>(undefined);

  const getSourceType = (url: string) => {
    const lower = url.toLowerCase();
    if (lower.includes(".m3u8")) return "application/x-mpegURL";
    if (lower.includes(".webm")) return "video/webm";
    if (lower.includes(".mov")) return "video/quicktime";
    if (lower.includes(".avi")) return "video/x-msvideo";
    if (lower.includes(".mkv")) return "video/x-matroska";
    return "video/mp4";
  };

  // video.js only plays direct media files/streams -- a youtube.com or
  // vimeo.com page URL isn't one, and silently defaulted to "video/mp4"
  // above, which fails as MEDIA_ERR_SRC_NOT_SUPPORTED. Detect those and
  // render an iframe embed instead, since the upload form advertises
  // YouTube/Vimeo URL support but nothing ever implemented it.
  const getEmbedUrl = (url: string): string | null => {
    try {
      const u = new URL(url);
      const host = u.hostname.replace(/^www\./, "");

      if (host === "youtu.be") {
        const id = u.pathname.slice(1);
        return id ? `https://www.youtube.com/embed/${id}` : null;
      }
      if (host === "youtube.com" || host === "m.youtube.com") {
        const id = u.searchParams.get("v");
        if (id) return `https://www.youtube.com/embed/${id}`;
        if (u.pathname.startsWith("/embed/")) return url;
        if (u.pathname.startsWith("/shorts/")) {
          return `https://www.youtube.com/embed/${u.pathname.split("/")[2]}`;
        }
        return null;
      }
      if (host === "vimeo.com") {
        const id = u.pathname.split("/").filter(Boolean)[0];
        return id && /^\d+$/.test(id) ? `https://player.vimeo.com/video/${id}` : null;
      }
      if (host === "player.vimeo.com") {
        return url;
      }
      return null;
    } catch {
      return null;
    }
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

  const embedUrl = useMemo(() => {
    const primary = normalizedSources[0];
    return primary ? getEmbedUrl(primary.src) : null;
  }, [normalizedSources]);

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
    if (!poster) {
      setResolvedPoster(undefined);
      return;
    }

    let cancelled = false;
    const img = new Image();

    img.onload = () => {
      if (!cancelled) setResolvedPoster(poster);
    };
    img.onerror = () => {
      if (!cancelled) setResolvedPoster("/placeholder-video.jpg");
    };

    img.src = poster;

    return () => {
      cancelled = true;
    };
  }, [poster]);

  useEffect(() => {
    if (embedUrl) return;
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
        poster: resolvedPoster,
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
    if (resolvedPoster) {
      player.poster(resolvedPoster);
    } else {
      player.poster("");
    }
  }, [normalizedSources, selectedIndex, resolvedPoster]);

  if (embedUrl) {
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden bg-black">
        <iframe
          src={embedUrl}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          title="Video player"
        />
      </div>
    );
  }

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
                  ? "bg-gradient-to-r from-primary-400 to-primary-700 text-white"
                  : "bg-white/10 text-white/70 border border-white/10 hover:bg-white/20"
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
