"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/hooks/useAuth";
import { api } from "@/lib/api";
import bs58 from "bs58";

export default function LoginPage() {
  const router = useRouter();
  const { login, walletLogin, isAuthenticated } = useAuth();
  const { publicKey, signMessage, connected } = useWallet();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletLoading, setIsWalletLoading] = useState(false);

  // Redirect if already authenticated
  if (isAuthenticated) {
    router.push("/videos");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      await login(email, password);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handleWalletLogin = async () => {
    if (!publicKey || !signMessage) {
      setError("Please connect your wallet first.");
      return;
    }

    setError("");
    setIsWalletLoading(true);

    try {
      const walletAddress = publicKey.toBase58();
      const nonceResponse = await api.get<{ nonce: string }>(
        "/auth/wallet/nonce",
        { params: { walletAddress } }
      );
      const message = `Sign this message to authenticate with VibeChain: ${nonceResponse.nonce}`;
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(messageBytes);
      const signature = bs58.encode(signatureBytes);
      await walletLogin(walletAddress, signature, nonceResponse.nonce);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Wallet login failed. Please try again.");
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#050505] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-white">
            VibeChain
          </Link>
          <p className="text-white/50 mt-2">Welcome back</p>
        </div>

        <div className="vc-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/60 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm text-white/60 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-400/30"
                placeholder="********"
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 vc-primary-button rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-[#0A0A0A] text-white/40">
                Or continue with
              </span>
            </div>
          </div>

          <div className="flex justify-center">
            <WalletMultiButton className="!bg-gradient-to-r !from-violet-600 !to-purple-700 !rounded-lg !py-3 !font-semibold !w-full !justify-center" />
          </div>

          {connected && (
            <button
              type="button"
              onClick={handleWalletLogin}
              disabled={isWalletLoading}
              className="mt-4 w-full py-3 vc-outline-button rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWalletLoading ? "Signing in with wallet..." : "Sign in with wallet"}
            </button>
          )}

          <p className="text-center text-white/50 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-primary-400 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
