import Image from "next/image";
import Link from "next/link";
import { Heart, Play } from "lucide-react";

interface VideoCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  voteCount: number;
  duration?: string;
}

export function VideoCard({
  id,
  title,
  artist,
  thumbnailUrl,
  voteCount,
  duration,
}: VideoCardProps) {
  return (
    <Link href={`/videos/${id}`} className="group">
      <div className="relative aspect-video rounded-lg overflow-hidden bg-orange-100">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <Play className="w-12 h-12 text-white" />
        </div>
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
            {duration}
          </div>
        )}
      </div>
      <div className="mt-3">
        <h3 className="font-semibold text-slate-900 truncate">{title}</h3>
        <p className="text-sm text-slate-500">{artist}</p>
        <div className="flex items-center gap-1 mt-1 text-sm text-orange-600">
          <Heart className="w-4 h-4" />
          <span>{voteCount.toLocaleString()} votes</span>
        </div>
      </div>
    </Link>
  );
}
