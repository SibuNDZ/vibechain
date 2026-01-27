import Image from "next/image";
import Link from "next/link";

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
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <div className="relative aspect-video">
          <Image
            src={thumbnailUrl}
            alt={title}
            fill
            className="object-cover transition-transform group-hover:scale-105"
          />
          <div className="absolute top-2 right-2 bg-green-500 px-2 py-1 rounded text-xs font-semibold text-white">
            {daysLeft} days left
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-white truncate">{title}</h3>
          <p className="text-sm text-gray-400 mb-3">{artist}</p>

          <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>

          <div className="flex justify-between text-sm">
            <div>
              <span className="text-white font-semibold">
                ${raisedAmount.toLocaleString()}
              </span>
              <span className="text-gray-400"> of ${goalAmount.toLocaleString()}</span>
            </div>
            <span className="text-gray-400">{backerCount} backers</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
