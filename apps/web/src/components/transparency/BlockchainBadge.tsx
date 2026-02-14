"use client";

import { Shield, ExternalLink, CheckCircle } from "lucide-react";
import { formatAddress, getExplorerUrl, getContractExplorerUrl } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface BlockchainBadgeProps {
  type: "vote" | "contribution" | "contract";
  txHash?: string;
  contractAddress?: string;
  network?: "polygon" | "amoy";
  verified?: boolean;
  className?: string;
}

export function BlockchainBadge({
  type,
  txHash,
  contractAddress,
  network = "amoy",
  verified = true,
  className,
}: BlockchainBadgeProps) {
  const getUrl = () => {
    if (type === "contract" && contractAddress) {
      return getContractExplorerUrl(contractAddress, network);
    }
    if (txHash) {
      return getExplorerUrl(txHash, network);
    }
    return null;
  };

  const url = getUrl();

  const getBadgeText = () => {
    switch (type) {
      case "vote":
        return "Verified Vote";
      case "contribution":
        return "On-Chain";
      case "contract":
        return "Smart Contract";
      default:
        return "Verified";
    }
  };

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 border border-green-200 rounded-full text-xs font-medium text-green-700 hover:bg-green-100 transition-colors",
          className
        )}
      >
        <Shield className="w-3 h-3" />
        {type === "contract" && contractAddress && (
          <span className="font-mono">{formatAddress(contractAddress)}</span>
        )}
        {txHash && <span className="font-mono">{formatAddress(txHash)}</span>}
        <ExternalLink className="w-3 h-3" />
      </a>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        verified
          ? "bg-green-50 border border-green-200 text-green-700"
          : "bg-orange-50 border border-orange-200 text-slate-500",
        className
      )}
    >
      {verified ? (
        <CheckCircle className="w-3 h-3" />
      ) : (
        <Shield className="w-3 h-3" />
      )}
      {getBadgeText()}
    </span>
  );
}
