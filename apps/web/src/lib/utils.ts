import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  const weeks = Math.floor(diff / 604800000);
  const months = Math.floor(diff / 2592000000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  if (months < 12) return `${months}mo ago`;
  return date.toLocaleDateString();
}

export function getExplorerUrl(
  txHash: string,
  network: "polygon" | "amoy" = "polygon"
): string {
  const baseUrls = {
    polygon: "https://polygonscan.com/tx/",
    amoy: "https://amoy.polygonscan.com/tx/",
  };
  return `${baseUrls[network]}${txHash}`;
}

export function getContractExplorerUrl(
  address: string,
  network: "polygon" | "amoy" = "polygon"
): string {
  const baseUrls = {
    polygon: "https://polygonscan.com/address/",
    amoy: "https://amoy.polygonscan.com/address/",
  };
  return `${baseUrls[network]}${address}`;
}
