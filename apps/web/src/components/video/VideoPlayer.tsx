"use client";

import { useEffect, useRef } from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";
import type Player from "video.js/dist/types/player";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onReady?: (player: Player) => void;
}

export function VideoPlayer({ src, poster, onReady }: VideoPlayerProps) {
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

  useEffect(() => {
    if (!playerRef.current && videoRef.current) {
      const videoElement = document.createElement("video-js");
      videoElement.classList.add("vjs-big-play-centered");
      videoRef.current.appendChild(videoElement);

      const player = (playerRef.current = videojs(videoElement, {
        autoplay: false,
        controls: true,
        responsive: true,
        fluid: true,
        poster,
        sources: [
          {
            src,
            type: getSourceType(src),
          },
        ],
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
  }, [src, poster, onReady]);

  return (
    <div data-vjs-player>
      <div ref={videoRef} className="w-full aspect-video rounded-lg overflow-hidden" />
    </div>
  );
}
