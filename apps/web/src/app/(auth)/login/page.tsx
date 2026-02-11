"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAuth } from "@/hooks/useAuth";
import { useAccount, useSignMessage } from "wagmi";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const { login, walletLogin, isAuthenticated } = useAuth();
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();
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
    if (!address) {
      setError("Please connect your wallet first.");
      return;
    }

    setError("");
    setIsWalletLoading(true);

    try {
      const nonceResponse = await api.get<{ nonce: string }>(
        "/auth/wallet/nonce",
        { params: { walletAddress: address } }
      );
      const message = `Sign this message to authenticate with VibeChain: ${nonceResponse.nonce}`;
      const signature = await signMessageAsync({ message });
      await walletLogin(address, signature, nonceResponse.nonce);
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error.message || "Wallet login failed. Please try again.");
    } finally {
      setIsWalletLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-orange-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-slate-900">
            VibeChain
          </Link>
          <p className="text-slate-500 mt-2">Welcome back</p>
        </div>

        <div className="vc-card p-8">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-600 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
                placeholder="you@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-orange-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-200"
                placeholder="********"
                required
                disabled={isLoading}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 vc-primary-button rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-orange-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-orange-50 text-slate-500">
                Or continue with
              </span>
            </div>
          </div>

          <div>
            <ConnectButton.Custom>
              {({
                account,
                chain,
                openAccountModal,
                openChainModal,
                openConnectModal,
                mounted,
              }) => {
                const ready = mounted;
                const connected = ready && account && chain;

                return (
                  <div
                    className={!ready ? "opacity-0 pointer-events-none select-none" : ""}
                  >
                    {!connected ? (
                      <button
                        type="button"
                        onClick={openConnectModal}
                        className="w-full vc-primary-button rounded-lg py-3 font-semibold"
                      >
                        Connect Wallet
                      </button>
                    ) : chain?.unsupported ? (
                      <button
                        type="button"
                        onClick={openChainModal}
                        className="w-full vc-primary-button rounded-lg py-3 font-semibold"
                      >
                        Wrong network
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openAccountModal}
                        className="w-full vc-primary-button rounded-lg py-3 font-semibold"
                      >
                        {account.displayName}
                      </button>
                    )}
                  </div>
                );
              }}
            </ConnectButton.Custom>
          </div>

          {isConnected && (
            <button
              type="button"
              onClick={handleWalletLogin}
              disabled={isWalletLoading}
              className="mt-4 w-full py-3 vc-outline-button rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isWalletLoading ? "Signing in with wallet..." : "Sign in with wallet"}
            </button>
          )}

          <p className="text-center text-slate-500 text-sm mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-red-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
