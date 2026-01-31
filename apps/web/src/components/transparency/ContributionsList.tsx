"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, ChevronDown, ChevronUp, Users } from "lucide-react";
import { api } from "@/lib/api";
import { formatAddress, getExplorerUrl, formatRelativeTime } from "@/lib/utils";
import { BlockchainBadge } from "./BlockchainBadge";

interface Contributor {
  id: string;
  amount: string;
  txHash: string;
  createdAt: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
}

interface ContributionsListProps {
  campaignId: string;
  initialExpanded?: boolean;
}

export function ContributionsList({
  campaignId,
  initialExpanded = false,
}: ContributionsListProps) {
  const [contributions, setContributions] = useState<Contributor[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    if (isExpanded && contributions.length === 0) {
      fetchContributions();
    }
  }, [isExpanded]);

  const fetchContributions = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{
        data: Contributor[];
        meta: { total: number };
      }>(`/crowdfunding/campaigns/${campaignId}/contributions?limit=10`);
      setContributions(response.data);
      setTotal(response.meta.total);
    } catch (err) {
      console.error("Failed to fetch contributions:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-800 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />
          <span className="font-medium text-white">
            Contributors {total > 0 && `(${total})`}
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>

      {/* List */}
      {isExpanded && (
        <div className="border-t border-gray-700">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gray-700" />
                  <div className="flex-1">
                    <div className="h-4 w-24 bg-gray-700 rounded" />
                    <div className="h-3 w-16 bg-gray-700 rounded mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : contributions.length === 0 ? (
            <div className="p-6 text-center text-gray-400">
              No contributions yet. Be the first!
            </div>
          ) : (
            <div className="divide-y divide-gray-700">
              {contributions.map((contrib) => (
                <div
                  key={contrib.id}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <Link href={`/users/${contrib.user.id}`}>
                      {contrib.user.avatarUrl ? (
                        <img
                          src={contrib.user.avatarUrl}
                          alt={contrib.user.username}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-white text-sm font-semibold">
                          {contrib.user.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </Link>
                    <div>
                      <Link
                        href={`/users/${contrib.user.id}`}
                        className="font-medium text-white hover:text-purple-400 transition-colors"
                      >
                        {contrib.user.username}
                      </Link>
                      <p className="text-xs text-gray-400">
                        {formatRelativeTime(contrib.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-green-400">
                      {parseFloat(contrib.amount).toFixed(2)} MATIC
                    </span>
                    <a
                      href={getExplorerUrl(contrib.txHash, "amoy")}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}

          {total > contributions.length && (
            <div className="p-4 border-t border-gray-700">
              <button
                onClick={() => {
                  /* Could load more here */
                }}
                className="w-full text-center text-purple-400 hover:text-purple-300 text-sm transition-colors"
              >
                View all {total} contributors
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
