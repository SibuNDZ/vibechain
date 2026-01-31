"use client";

import { useState, useEffect } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther } from "viem";
import toast from "react-hot-toast";

interface FundButtonProps {
  campaignId: string;
  contractAddress: `0x${string}`;
  minContribution?: number;
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
      const message = writeError.message.includes("User rejected")
        ? "Transaction was rejected"
        : writeError.message.includes("insufficient funds")
        ? "Insufficient funds in your wallet"
        : "Failed to send transaction. Please try again.";
      toast.error(message);
      reset();
    }
  }, [writeError, reset]);

  // Handle transaction errors
  useEffect(() => {
    if (txError) {
      toast.error("Transaction failed on chain. Please try again.");
    }
  }, [txError]);

  // Handle successful transaction
  useEffect(() => {
    if (isSuccess) {
      toast.success("Thank you for your contribution!");
      setIsOpen(false);
      setAmount(minContribution.toString());
    }
  }, [isSuccess, minContribution]);

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
        className="w-full py-3 bg-gray-600 text-gray-400 rounded-lg cursor-not-allowed"
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
              className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-purple-500"
              placeholder="Amount in MATIC"
            />
            <span className="text-gray-400">MATIC</span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsOpen(false)}
              className="flex-1 py-2 border border-gray-600 text-gray-400 rounded-lg hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleFund}
              disabled={isPending || isConfirming}
              className="flex-1 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50"
            >
              {isPending || isConfirming ? "Processing..." : "Confirm"}
            </button>
          </div>
                  </>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-semibold hover:opacity-90 transition"
        >
          Fund This Project
        </button>
      )}
    </div>
  );
}
