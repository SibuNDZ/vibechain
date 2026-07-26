"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Upload, MessageCircle, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { UserDropdown } from "./UserDropdown";
import { NotificationsBell } from "./NotificationsBell";
import { InstallAppButton } from "./InstallAppButton";
import { api } from "@/lib/api";

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
}

const TOKEN_KEY = "vibechain_token";

// Shown in the dark marketing nav for signed-out visitors. Kept to routes
// that actually exist in the app (no Genres/Pricing/Live -- not built yet).
const MARKETING_LINKS = [
  { href: "/videos", label: "Discover" },
  { href: "/videos?sortBy=votes", label: "Trending" },
  { href: "/crowdfunding", label: "Campaigns" },
];

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
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 sm:h-20">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Image
                src="/brand/vc-mark.png"
                alt="VibeChain"
                width={20}
                height={20}
                className="w-5 h-5"
              />
            </div>
            <span className="text-sm font-semibold text-white tracking-wide">
              VibeChain
            </span>
          </Link>

          {!user && (
            <nav className="hidden md:flex items-center gap-8">
              {MARKETING_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-white/70 hover:text-primary-400 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-3">
            {isLoading ? (
              <div className="w-8 h-8 rounded-full bg-white/10 animate-pulse" />
            ) : user ? (
              <>
                <InstallAppButton className="hidden sm:inline-flex" />

                <Link
                  href="/upload"
                  className="hidden sm:flex items-center gap-2 px-4 py-2 vc-primary-button rounded-lg font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </Link>

                <Link
                  href="/messages"
                  className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </Link>

                <NotificationsBell />

                <UserDropdown user={user} onLogout={handleLogout} isAdmin={isAdmin} />
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-3">
                <InstallAppButton />
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-semibold text-white border border-white/20 rounded-lg hover:bg-white/5 hover:border-white/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  Log In
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-primary-400 to-primary-700 shadow-[0_4px_24px_rgba(56,189,248,0.3)] hover:brightness-110 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400"
                >
                  Get Started
                </Link>
              </div>
            )}

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
              className="md:hidden p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile slide-out drawer */}
      <div
        className={cn(
          "md:hidden fixed inset-0 top-16 bg-black/60 backdrop-blur-xl transition-opacity",
          isMobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <nav
          className="flex flex-col gap-1 p-6 bg-[#0A0A0A] border-b border-white/10"
          onClick={(e) => e.stopPropagation()}
        >
          {user ? (
            <>
              <InstallAppButton className="w-full justify-center mb-2" />
              <Link
                href="/upload"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-3 vc-primary-button rounded-lg font-medium"
              >
                <Upload className="w-4 h-4" />
                Upload Video
              </Link>
              <Link
                href="/my-uploads"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                My Uploads
              </Link>
              <Link
                href="/messages"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                Messages
              </Link>
              <Link
                href={`/users/${user.id}`}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                My Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
              >
                Settings
              </Link>
              {isAdmin && (
                <Link
                  href="/admin/insights"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Admin Insights
                </Link>
              )}
              <div className="h-px bg-white/10 my-2" />
              <button
                onClick={() => {
                  handleLogout();
                  setIsMobileMenuOpen(false);
                }}
                className="px-4 py-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-white/5 transition-colors text-left"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              {MARKETING_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="px-4 py-3 rounded-lg text-white/80 hover:text-white hover:bg-white/5 transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <InstallAppButton className="w-full justify-center my-2" />
              <Link
                href="/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-center border border-white/20 text-white font-semibold hover:bg-white/5 transition-colors"
              >
                Log In
              </Link>
              <Link
                href="/register"
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 rounded-lg text-center text-white font-semibold bg-gradient-to-r from-primary-400 to-primary-700"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
