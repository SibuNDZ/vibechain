"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { getSolanaEndpoint, getWallets } from "@/lib/solana";

import "@solana/wallet-adapter-react-ui/styles.css";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const endpoint = useMemo(() => getSolanaEndpoint(), []);
  const wallets = useMemo(() => getWallets(), []);

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            {children}
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
