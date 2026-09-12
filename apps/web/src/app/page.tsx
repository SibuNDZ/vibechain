import type { Metadata } from "next";
import { HomeClient } from "@/components/landing/HomeClient";

export const metadata: Metadata = {
  title: "VibeChain — Music videos owned by the crowd",
  description:
    "A decentralized platform for music video streaming, community voting, and Solana crowdfunding.",
};

export default function Home() {
  return <HomeClient />;
}
