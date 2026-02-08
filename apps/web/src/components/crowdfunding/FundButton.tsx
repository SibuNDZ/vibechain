"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import toast from "react-hot-toast";
import { BaseError, UserRejectedRequestError } from "viem";

interface FundButtonProps {
  campaignId: string;
  contractAddress: `0x${string}`;
  minContribution?: number;
}

/**
 * Parse blockchain errors and return user-friendly messages
 */
function getErrorMessage(error: Error): string {
  // Check for user rejection (works with different wallet providers)
  if (error instanceof UserRejectedRequestError) {
    return "Transaction was rejected";
  }

  // Check for viem BaseError which has structured error info
  if (error instanceof BaseError) {
    const message = error.shortMessage || error.message;

    // Common error patterns
    if (message.toLowerCase().includes("user rejected") ||
        message.toLowerCase().includes("user denied")) {
      return "Transaction was rejected";
    }
    if (message.toLowerCase().includes("insufficient funds") ||
        message.toLowerCase().includes("insufficient balance")) {
      return "Insufficient funds in your wallet";
    }
    if (message.toLowerCase().includes("gas")) {
      return "Transaction failed due to gas issues. Try increasing gas limit.";
    }
    if (message.toLowerCase().includes("nonce")) {
      return "Transaction nonce error. Please try again.";
    }

    // Return the short message if available, otherwise generic
    return error.shortMessage || "Failed to send transaction. Please try again.";
  }

  // Fallback for non-viem errors
  const message = error.message.toLowerCase();
  if (message.includes("user rejected") || message.includes("user denied")) {
    return "Transaction was rejected";
  }
  if (message.includes("insufficient")) {
    return "Insufficient funds in your wallet";
  }

  return "Failed to send transaction. Please try again.";
}

export function FundButton({
  campaignId,
  contractAddress,
  minContribution = 0.01,
}: FundButtonProps) {
  const [amount, setAmount] = useState(minContribution.toString());
  const [isOpen, setIsOpen] = useState(false);
  const { isConnected } = useAccount();

  const { writeContract, data: hash, isPending, error: writeError, reset } = useWriteContract();

  const { isLoading: isConfirming, isSuccess, error: txError } = useWaitForTransactionReceipt({
    hash,
  });

  // Handle write errors (user rejection, insufficient funds, etc.)
  useEffect(() => {
    if (writeError) {
      const message = getErrorMessage(writeError);
      toast.error(message);
      reset();
    }
  }, [writeError, reset]);

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      const message = getErrorMessage(txError);
      toast.error(message);
      // Reset form state on transaction failure
      setAmount(minContribution.toString());
      reset();
    }
  }, [txError, minContribution, reset]);

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      toast.success("Thank you for your contribution!");
      setIsOpen(false);
      setAmount(minContribution.toString());
      reset();
    }
  }, [isSuccess, minContribution, reset]);

  const handleFund = async () => {
    if (!isConnected) {
      toast.error("Please connect your wallet first");
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < minContribution) {
      toast.error(`Minimum contribution is ${minContribution} MATIC`);
      return;
    }

    writeContract({
      address: contractAddress,
      abi: [
        {
          name: "contribute",
          type: "function",
          stateMutability: "payable",
          inputs: [{ name: "campaignId", type: "uint256" }],
          outputs: [],
        },
      ],
      functionName: "contribute",
      args: [BigInt(campaignId)],
      value: parseEther(amount),
    });
  };

  if (!isConnected) {
    return (
      <button
        disabled
        className="w-full py-3 bg-orange-100 text-orange-400 rounded-lg cursor-not-allowed border border-orange-200"
      >
        Connect Wallet to Fund
      </button>
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
              className="flex-1 px-4 py-2 bg-white border border-orange-200 rounded-lg text-slate-900 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
              placeholder="Amount in MATIC"
            />
            <span className="text-slate-500">MATIC</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 border border-orange-200 text-slate-600 rounded-lg hover:bg-orange-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleFund}
              disabled={isPending || isConfirming}
              className="flex-1 py-2 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isPending || isConfirming ? "Processing..." : "Confirm"}
            </button>
          </div>
                  </>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          Fund This Project
        </button>
      )}
    </div>
  );
}
