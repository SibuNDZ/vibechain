import Link from "next/link";
import { SafeImage } from "@/components/ui/SafeImage";

interface CampaignCardProps {
  id: string;
  title: string;
  artist: string;
  thumbnailUrl: string;
  goalAmount: number;
  raisedAmount: number;
  backerCount: number;
  daysLeft: number;
}

export function CampaignCard({
  id,
  title,
  artist,
  thumbnailUrl,
  goalAmount,
  raisedAmount,
  backerCount,
  daysLeft,
}: CampaignCardProps) {
  const progress = (raisedAmount / goalAmount) * 100;

  return (
    <Link href={`/crowdfunding/${id}`} className="group">
      <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl overflow-hidden backdrop-blur-md">
        <div className="relative aspect-video">
          <SafeImage
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
            fallbackSrc="/placeholder-campaign.jpg"
          />
          <div className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded text-xs font-semibold text-white">
            {daysLeft} days left
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white truncate">{title}</h3>
          <p className="text-sm text-white/50 mb-3">{artist}</p>

          <div className="w-full bg-white/10 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-primary-400 to-primary-700 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <span className="text-white font-semibold">
                ${raisedAmount.toLocaleString()}
              </span>
              <span className="text-white/50"> of ${goalAmount.toLocaleString()}</span>
            </div>
            <span className="text-white/50">{backerCount} backers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
