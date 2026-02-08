import type { Metadata } from "next";
import { Fredoka, Luckiest_Guy } from "next/font/google";
import dynamic from "next/dynamic";
import { Toaster } from "react-hot-toast";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import "./globals.css";

const Providers = dynamic(() => import("@/providers").then((mod) => mod.Providers), {
  ssr: false,
});

const AIChatButton = dynamic(
  () => import("@/components/ai/AIChatButton").then((mod) => mod.AIChatButton),
  { ssr: false }
);

const Header = dynamic(
  () => import("@/components/layout/Header").then((mod) => mod.Header),
  { ssr: false }
);

const fredoka = Fredoka({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const luckiestGuy = Luckiest_Guy({
  subsets: ["latin"],
  variable: "--font-display",
  weight: "400",
});

export const metadata: Metadata = {
  title: "VibeChain - Music Video Platform",
  description: "Discover, vote, and fund the next big music videos",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-192.png",
  },
};

export const viewport = {
  themeColor: "#0f172a",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${fredoka.variable} ${luckiestGuy.variable}`}>
        <Providers>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1f2937',
                color: '#f3f4f6',
                border: '1px solid #374151',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#f3f4f6',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#f3f4f6',
                },
              },
            }}
          />
          <Header />
          <ErrorBoundary>
            <main className="pt-16">{children}</main>
          </ErrorBoundary>
          <AIChatButton />
        </Providers>
      </body>
    </html>
  );
}
