import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
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

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "VibeChain - Music Video Platform",
  description: "Discover, vote, and fund the next big music videos",
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
          <Header />
          <main className="pt-16">{children}</main>
          <AIChatButton />
        </Providers>
      </body>
    </html>
  );
}
