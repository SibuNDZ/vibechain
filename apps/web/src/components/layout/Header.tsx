"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Upload, MessageCircle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDropdown } from "./UserDropdown";
import { InstallAppButton } from "./InstallAppButton";
import { api } from "@/lib/api";

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
}

const TOKEN_KEY = "vibechain_token";

// Navigation links removed - using landing page CTAs instead

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check auth state on mount
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem(TOKEN_KEY);
      const userData = localStorage.getItem("vibechain_user");

      if (token && userData) {
        try {
          setUser(JSON.parse(userData));
        } catch {
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    checkAuth();

    // Listen for storage changes (login/logout in other tabs)
    window.addEventListener("storage", checkAuth);

    // Custom event for same-tab auth changes
    window.addEventListener("auth-change", checkAuth);

    return () => {
      window.removeEventListener("storage", checkAuth);
      window.removeEventListener("auth-change", checkAuth);
    };
  }, []);

  // Re-check auth on route change
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userData = localStorage.getItem("vibechain_user");

    if (token && userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        setUser(null);
      }
    } else {
      setUser(null);
    }
  }, [pathname]);

  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        await api.get("/admin/analytics/dashboards");
        setIsAdmin(true);
      } catch (err: any) {
        if (err?.statusCode === 401 || err?.statusCode === 403) {
          setIsAdmin(false);
        } else {
          setIsAdmin(false);
        }
      }
    };

    checkAdmin();
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("vibechain_user");
    setUser(null);
    window.dispatchEvent(new Event("auth-change"));
    router.push("/");
  };

  // Don't show header on auth pages
  if (pathname?.startsWith("/login") || pathname?.startsWith("/register")) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-orange-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <div className="flex flex-col items-center leading-none">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
                <Image
                  src="/brand/vc-mark.png"
                  alt="VibeChain"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
              </div>
              <span className="mt-1 text-xs font-semibold text-red-600 tracking-wide">
                VibeChain
              </span>
            </div>
          </Link>

          {/* Spacer for centered layout */}
          <div className="hidden md:block" />

          {/* Right Section */}
          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-orange-100 animate-pulse" />
            ) : user ? (
              <>
                <InstallAppButton className="hidden sm:inline-flex" />

                {/* Upload Button */}
                <Link
                  href="/upload"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 vc-primary-button rounded-lg transition-colors font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Link>

                {/* Messages */}
                <Link
                  href="/messages"
                  className="p-2 text-slate-500 hover:text-slate-900 hover:bg-orange-100 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>

                {/* User Dropdown */}
                <UserDropdown user={user} onLogout={handleLogout} isAdmin={isAdmin} />
              </>
            ) : (
              <div className="flex items-center gap-2">
                <InstallAppButton className="hidden sm:inline-flex" />
                <Link
                  href="/login"
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 vc-primary-button rounded-lg transition-colors font-medium"
                >
                  Sign Up
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-500 hover:text-slate-900 hover:bg-orange-100 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-orange-200">
            <nav className="flex flex-col gap-2">
              {user ? (
                <>
                  <InstallAppButton className="w-full justify-center" />
                  <Link
                    href="/upload"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 vc-primary-button rounded-lg transition-colors font-medium"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Video
                  </Link>
                  <Link
                    href="/my-uploads"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-orange-100 transition-colors"
                  >
                    My Uploads
                  </Link>
                  <Link
                    href="/messages"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-orange-100 transition-colors"
                  >
                    Messages
                  </Link>
                  <Link
                    href={`/users/${user.id}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-orange-100 transition-colors"
                  >
                    My Profile
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-orange-100 transition-colors"
                  >
                    Settings
                  </Link>
                  {isAdmin && (
                    <Link
                      href="/admin/insights"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-orange-100 transition-colors"
                    >
                      Admin Insights
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-red-600 hover:text-red-700 hover:bg-orange-100 transition-colors text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <InstallAppButton className="w-full justify-center" />
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-orange-100 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="px-4 py-2 vc-primary-button rounded-lg transition-colors font-medium text-center"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
