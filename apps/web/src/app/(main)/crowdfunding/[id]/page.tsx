"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, Users } from "lucide-react";
import { api, Campaign } from "@/lib/api";
import { FundButton } from "@/components/crowdfunding/FundButton";
import { ContributionsList } from "@/components/transparency/ContributionsList";
import { BlockchainBadge } from "@/components/transparency/BlockchainBadge";
import { SafeImage } from "@/components/ui/SafeImage";
import { campaignAmount, campaignEndDate } from "@/lib/utils";

export default function CampaignDetailPage() {
  const params = useParams();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchCampaign = useCallback(async () => {
    try {
      const data = await api.get<Campaign>(`/crowdfunding/campaigns/${campaignId}`);
      setCampaign(data);
      setError("");
    } catch (err: unknown) {
      const message =
        (err as { message?: string }).message || "Failed to load campaign";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [campaignId]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  const handleFunded = () => {
    setRefreshKey((k) => k + 1);
    void fetchCampaign();
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#050505] py-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="h-8 w-40 bg-white/10 rounded mb-6 animate-pulse" />
          <div className="aspect-video bg-white/5 rounded-xl animate-pulse" />
        </div>
      </main>
    );
  }

  if (error || !campaign) {
    return (
      <main className="min-h-screen bg-[#050505] py-8">
        <div className="max-w-5xl mx-auto px-6">
          <Link
            href="/crowdfunding"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to campaigns
          </Link>
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">
            {error || "Campaign not found"}
          </div>
        </div>
      </main>
    );
  }

  const goal = campaignAmount(campaign.goalAmount);
  const raised = campaignAmount(campaign.raisedAmount);
  const progress = goal > 0 ? Math.min((raised / goal) * 100, 100) : 0;
  const end = campaignEndDate(campaign);
  const daysLeft = end
    ? Math.max(
        0,
        Math.ceil((new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      )
    : 0;
  const network =
    process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
      ? "mainnet-beta"
      : "devnet";

  return (
    <main className="min-h-screen bg-[#050505] py-8">
      <div className="max-w-5xl mx-auto px-6">
        <Link
          href="/crowdfunding"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to campaigns
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          <div className="lg:col-span-3 space-y-6">
            <div className="relative aspect-video rounded-xl overflow-hidden border border-white/[0.08]">
              <SafeImage
                src={campaign.video.thumbnailUrl}
                alt={campaign.video.title}
                fill
                className="object-cover"
                fallbackSrc="/placeholder-campaign.jpg"
              />
            </div>

            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {campaign.video.title}
              </h1>
              <Link
                href={`/users/${campaign.video.user.id}`}
                className="text-white/60 hover:text-primary-400"
              >
                {campaign.video.user.username}
              </Link>
            </div>

            {campaign.video.description && (
              <p className="text-white/70 whitespace-pre-wrap">
                {campaign.video.description}
              </p>
            )}

            <ContributionsList
              key={refreshKey}
              campaignId={campaign.id}
              initialExpanded
            />
          </div>

          <aside className="lg:col-span-2 space-y-4">
            <div className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white font-semibold">
                    {raised.toLocaleString()} SOL
                  </span>
                  <span className="text-white/50">
                    of {goal.toLocaleString()} SOL
                  </span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary-400 to-primary-700 h-2 rounded-full"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-white/70">
                  <Users className="w-4 h-4 text-primary-400" />
                  {campaign._count.contributions} backers
                </div>
                <div className="flex items-center gap-2 text-white/70">
                  <Calendar className="w-4 h-4 text-primary-400" />
                  {daysLeft} days left
                </div>
              </div>

              <div className="text-xs uppercase tracking-wide text-white/40">
                {campaign.status}
              </div>

              {campaign.status === "ACTIVE" ? (
                <FundButton
                  campaignId={campaign.id}
                  programAddress={campaign.contractAddress}
                  onFunded={handleFunded}
                />
              ) : (
                <p className="text-sm text-white/50 text-center py-3">
                  This campaign is no longer accepting funds.
                </p>
              )}

              {campaign.contractAddress && (
                <BlockchainBadge
                  type="contract"
                  contractAddress={campaign.contractAddress}
                  network={network}
                />
              )}
            </div>

            <Link
              href={`/videos/${campaign.videoId}`}
              className="block text-center text-sm text-primary-400 hover:text-primary-300"
            >
              Watch the video
            </Link>
          </aside>
        </div>
      </div>
    </main>
  );
}
