import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";
import { PROGRAM_IDS, SOLANA_CLUSTERS } from "@vibechain/shared";

export function getSolanaNetwork(): WalletAdapterNetwork {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (network === "mainnet-beta") return WalletAdapterNetwork.Mainnet;
  return WalletAdapterNetwork.Devnet;
}

export function getCrowdfundingProgramId(override?: string | null): string {
  if (override) return override;
  if (process.env.NEXT_PUBLIC_CROWDFUNDING_PROGRAM) {
    return process.env.NEXT_PUBLIC_CROWDFUNDING_PROGRAM;
  }
  const cluster =
    process.env.NEXT_PUBLIC_SOLANA_NETWORK === "mainnet-beta"
      ? SOLANA_CLUSTERS.MAINNET
      : SOLANA_CLUSTERS.DEVNET;
  return PROGRAM_IDS[cluster].CROWDFUNDING;
}

export function getSolanaEndpoint(): string {
  const customRpc = process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  if (customRpc) return customRpc;
  return clusterApiUrl(getSolanaNetwork());
}

export function getWallets() {
  return [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
  ];
}
