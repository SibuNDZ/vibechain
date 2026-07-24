import { WalletAdapterNetwork } from "@solana/wallet-adapter-base";
import { PhantomWalletAdapter, SolflareWalletAdapter } from "@solana/wallet-adapter-wallets";
import { clusterApiUrl } from "@solana/web3.js";

export function getSolanaNetwork(): WalletAdapterNetwork {
  const network = process.env.NEXT_PUBLIC_SOLANA_NETWORK;
  if (network === "mainnet-beta") return WalletAdapterNetwork.Mainnet;
  return WalletAdapterNetwork.Devnet;
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
