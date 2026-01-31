"use client";

import { useEffect, useState } from "react";
import { CampaignCard } from "@/components/crowdfunding/CampaignCard";
import { CampaignCardSkeleton } from "@/components/ui/Skeleton";
import { api, Campaign, PaginatedResponse } from "@/lib/api";
import toast from "react-hot-toast";

export default function CrowdfundingPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await api.get<PaginatedResponse<Campaign>>(
        "/crowdfunding/campaigns",
        {
          params: { status: "ACTIVE", limit: "20" },
        }
      );
      setCampaigns(response.data);
    } catch (err: unknown) {
      const error = err as { message?: string };
      const errorMessage = error.message || "Failed to load campaigns";
      setError(errorMessage);
      toast.error(errorMessage);
      setCampaigns([]);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDaysLeft = (deadline: string): number => {
    const now = new Date();
    const end = new Date(deadline);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  return (
    <main className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Active Campaigns
          </h1>
          <p className="text-gray-400">
            Support top-voted artists in creating their next masterpiece
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        ) : campaigns.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-xl font-semibold text-white mb-2">
              No active campaigns
            </h2>
            <p className="text-gray-400">
              Check back soon for new crowdfunding opportunities!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                id={campaign.id}
                title={campaign.video.title}
                artist={campaign.video.user.username}
                thumbnailUrl={
                  campaign.video.thumbnailUrl || "/placeholder-campaign.jpg"
                }
                goalAmount={campaign.goalAmount}
                raisedAmount={campaign.raisedAmount}
                backerCount={campaign._count.contributions}
                daysLeft={calculateDaysLeft(campaign.deadline)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
