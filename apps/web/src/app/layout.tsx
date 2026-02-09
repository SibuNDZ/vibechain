import type { Metadata } from "next";
import { Inter } from "next/font/google";
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

const PwaRegister = dynamic(
  () => import("@/components/pwa/PwaRegister").then((mod) => mod.PwaRegister),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeChain - Music Video Platform",
  description: "Discover, vote, and fund the next big music videos",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192.png",
    apple: "/icon-512.png",
  },
};

export const viewport = {
  themeColor: "#dc2626",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
          <PwaRegister />
          <AIChatButton />
        </Providers>
      </body>
    </html>
  );
}
