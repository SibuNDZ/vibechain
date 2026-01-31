"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User, Wallet, Save, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { formatAddress } from "@/lib/utils";
import { ConnectButton } from "@rainbow-me/rainbowkit";

interface UserProfile {
  id: string;
  username: string;
  email: string | null;
  walletAddress: string | null;
  avatarUrl: string | null;
  bio: string | null;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Form state
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("vibechain_token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const fetchUser = async () => {
      try {
        const userData = await api.get<UserProfile>("/users/me");
        setUser(userData);
        setUsername(userData.username);
        setBio(userData.bio || "");
        setAvatarUrl(userData.avatarUrl || "");
      } catch (err) {
        console.error("Failed to fetch user:", err);
        router.replace("/login");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      const updatedUser = await api.patch<UserProfile>("/users/me", {
        username,
        bio: bio || null,
        avatarUrl: avatarUrl || null,
      });

      setUser(updatedUser);

      // Update localStorage for Header
      const storedUser = localStorage.getItem("vibechain_user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        localStorage.setItem(
          "vibechain_user",
          JSON.stringify({
            ...parsed,
            username: updatedUser.username,
            avatarUrl: updatedUser.avatarUrl,
            bio: updatedUser.bio,
          })
        );
        window.dispatchEvent(new Event("auth-change"));
      }

      setMessage({ type: "success", text: "Profile updated successfully!" });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update profile";
      setMessage({ type: "error", text: errorMessage });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 py-8">
        <div className="max-w-2xl mx-auto px-4">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-gray-800 rounded" />
            <div className="h-64 bg-gray-800 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <Link
          href={`/users/${user.id}`}
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </Link>

        <h1 className="text-3xl font-bold text-white mb-8">Settings</h1>

        {/* Success/Error Message */}
        {message && (
          <div
            className={`p-4 rounded-lg mb-6 ${
              message.type === "success"
                ? "bg-green-900/50 text-green-300 border border-green-700"
                : "bg-red-900/50 text-red-300 border border-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Profile Settings */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Profile Settings</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Preview */}
            <div className="flex items-center gap-4">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar preview"
                  className="w-20 h-20 rounded-full object-cover border-2 border-gray-700"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Avatar URL
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://example.com/avatar.jpg"
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={4}
                placeholder="Tell us about yourself..."
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
              />
            </div>

            {/* Email (read-only) */}
            {user.email && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email}
                  disabled
                  className="w-full px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-gray-400 cursor-not-allowed"
                />
                <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
              </div>
            )}

            {/* Save Button */}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </form>
        </div>

        {/* Wallet Settings */}
        <div className="bg-gray-800 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Wallet className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold text-white">Wallet Settings</h2>
          </div>

          <div className="space-y-4">
            {user.walletAddress ? (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Connected Wallet
                </label>
                <div className="flex items-center gap-3">
                  <code className="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 font-mono text-sm">
                    {formatAddress(user.walletAddress)}
                  </code>
                  <span className="px-3 py-1 bg-green-900/50 text-green-400 text-sm rounded-full border border-green-700">
                    Connected
                  </span>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-400 mb-4">
                  Connect a wallet to vote and contribute to crowdfunding campaigns.
                </p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-700">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
