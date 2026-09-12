"use client";

import { useState } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";
import {
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import toast from "react-hot-toast";
import { api, ApiError } from "@/lib/api";
import { getCrowdfundingProgramId } from "@/lib/solana";

interface FundButtonProps {
  campaignId: string;
  programAddress?: string | null;
  minContribution?: number;
  onFunded?: () => void;
}

function getErrorMessage(error: Error): string {
  const message = error.message.toLowerCase();

  if (
    message.includes("user rejected") ||
    message.includes("user denied") ||
    message.includes("cancelled")
  ) {
    return "Transaction was rejected";
  }
  if (message.includes("insufficient") || message.includes("not enough")) {
    return "Insufficient funds in your wallet";
  }
  if (message.includes("blockhash")) {
    return "Transaction expired. Please try again.";
  }
  if (message.includes("invalid public key")) {
    return "This campaign has no valid Solana destination yet";
  }

  return "Failed to send transaction. Please try again.";
}

export function FundButton({
  campaignId,
  programAddress,
  minContribution = 0.01,
  onFunded,
}: FundButtonProps) {
  const [amount, setAmount] = useState(minContribution.toString());
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const { connected, publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();

  const destination = getCrowdfundingProgramId(programAddress);

  const handleFund = async () => {
    if (!connected || !publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!localStorage.getItem("vibechain_token")) {
      toast.error("Please sign in to record your contribution");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < minContribution) {
      toast.error(`Minimum contribution is ${minContribution} SOL`);
      return;
    }

    let destinationKey: PublicKey;
    try {
      destinationKey = new PublicKey(destination);
    } catch {
      toast.error("This campaign has no valid Solana destination yet");
      return;
    }

    setIsPending(true);

    try {
      const lamports = Math.round(amountNum * LAMPORTS_PER_SOL);

      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: publicKey,
          toPubkey: destinationKey,
          lamports,
        })
      );

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, "confirmed");

      try {
        await api.post(`/crowdfunding/campaigns/${campaignId}/contribute`, {
          amount: amountNum,
          txSignature: signature,
        });
      } catch (err) {
        const message =
          err instanceof ApiError
            ? err.message
            : "Payment confirmed, but we could not record it. Contact support with your transaction signature.";
        toast.error(message);
        return;
      }

      toast.success("Thank you for your contribution!");
      setIsOpen(false);
      setAmount(minContribution.toString());
      onFunded?.();
    } catch (err) {
      const message = getErrorMessage(
        err instanceof Error ? err : new Error(String(err))
      );
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  if (!connected) {
    return (
      <div className="space-y-2">
        <p className="text-center text-sm text-white/50">Connect Wallet to Fund</p>
        <WalletConnectButton />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {isOpen ? (
        <>
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={minContribution}
              step="0.01"
              className="flex-1 px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
              placeholder="Amount in SOL"
            />
            <span className="text-white/50">SOL</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 border border-white/10 text-white/70 rounded-lg hover:bg-white/5 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleFund}
              disabled={isPending}
              className="flex-1 py-2 bg-gradient-to-r from-primary-400 to-primary-700 text-white rounded-lg font-semibold hover:brightness-110 transition disabled:opacity-50"
            >
              {isPending ? "Processing..." : "Confirm"}
            </button>
          </div>
        </>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-primary-400 to-primary-700 text-white rounded-lg font-semibold hover:brightness-110 transition"
        >
          Fund This Project
        </button>
      )}
    </div>
  );
}
