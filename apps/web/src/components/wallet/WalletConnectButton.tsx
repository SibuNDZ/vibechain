"use client";

import { useEffect, useMemo, useState } from "react";
import { WalletReadyState } from "@solana/wallet-adapter-base";
import { useWallet } from "@solana/wallet-adapter-react";
import { cn } from "@/lib/utils";

const WALLET_DIRECTORY = "https://solana.com/wallets";

const INSTALL_OPTIONS = [
  { name: "Phantom", url: "https://phantom.app/download" },
  { name: "Solflare", url: "https://solflare.com/download" },
  { name: "Backpack", url: "https://backpack.app" },
  { name: "Glow", url: "https://glow.app" },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}…${address.slice(-4)}`;
}

export function WalletConnectButton({ className }: { className?: string }) {
  const { wallets, select, connected, publicKey, disconnect, connecting } =
    useWallet();
  const [open, setOpen] = useState(false);

  const installed = useMemo(
    () =>
      wallets.filter((wallet) => wallet.readyState === WalletReadyState.Installed),
    [wallets]
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const buttonClass = cn(
    "inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-purple-700 py-3 font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50",
    className
  );

  if (connected && publicKey) {
    return (
      <button type="button" onClick={() => disconnect()} className={buttonClass}>
        {shortenAddress(publicKey.toBase58())}
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={connecting}
        className={buttonClass}
      >
        {connecting ? "Connecting..." : "Connect"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 px-4"
          onClick={() => setOpen(false)}
          role="presentation"
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="wallet-picker-title"
            className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0A0A0A] p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <h2
              id="wallet-picker-title"
              className="text-lg font-semibold text-white"
            >
              Connect a Solana wallet
            </h2>
            <p className="mt-1 text-sm text-white/50">
              Any installed Solana wallet in this browser can sign in. VibeChain
              does not require Phantom.
            </p>

            <div className="mt-4 max-h-64 space-y-2 overflow-y-auto">
              {installed.length > 0 ? (
                installed.map((wallet) => (
                  <button
                    key={wallet.adapter.name}
                    type="button"
                    onClick={() => {
                      select(wallet.adapter.name);
                      setOpen(false);
                    }}
                    className="flex w-full items-center gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-left text-white transition hover:border-white/25 hover:bg-white/10"
                  >
                    {wallet.adapter.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={wallet.adapter.icon}
                        alt=""
                        className="h-8 w-8 rounded-md"
                      />
                    ) : (
                      <span className="h-8 w-8 rounded-md bg-white/10" />
                    )}
                    <span className="font-medium">{wallet.adapter.name}</span>
                  </button>
                ))
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/60">
                  No wallet extension detected. Install one, then come back to
                  this page.
                </p>
              )}
            </div>

            <p className="mt-5 text-xs font-medium uppercase tracking-wide text-white/40">
              Popular wallets
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {INSTALL_OPTIONS.map((wallet) => (
                <a
                  key={wallet.name}
                  href={wallet.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border border-white/10 px-3 py-2 text-center text-sm text-white/70 hover:border-white/25 hover:text-white"
                >
                  Get {wallet.name}
                </a>
              ))}
            </div>

            <a
              href={WALLET_DIRECTORY}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 block text-center text-sm text-primary-400 hover:underline"
            >
              Browse all Solana wallets
            </a>

            <button
              type="button"
              onClick={() => setOpen(false)}
              className="mt-4 w-full text-sm text-white/40 hover:text-white/70"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
