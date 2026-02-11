import { http } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export function createWagmiConfig() {
  const projectId = process.env.NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID;

  if (!projectId) {
    throw new Error(
      "Missing NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID environment variable. " +
      "Get a project ID from https://cloud.walletconnect.com/"
    );
  }

  return getDefaultConfig({
    appName: "VibeChain",
    projectId,
    chains: [polygon, polygonAmoy],
    transports: {
      [polygon.id]: http(),
      [polygonAmoy.id]: http(),
    },
    ssr: true,
  });
}
