"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

interface InstallAppButtonProps {
  className?: string;
  label?: string;
}

export function InstallAppButton({
  className,
  label = "Install App",
}: InstallAppButtonProps) {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(display-mode: standalone)");
    const updateStandalone = () => setIsInstalled(mediaQuery.matches);

    updateStandalone();
    mediaQuery.addEventListener("change", updateStandalone);

    const handleBeforeInstall = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      mediaQuery.removeEventListener("change", updateStandalone);
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstall = async () => {
    if (isInstalled) {
      toast("VibeChain is already installed.");
      return;
    }

    if (!deferredPrompt) {
      toast("Install isn’t available yet. Try refreshing or use your browser menu.");
      return;
    }

    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-purple-500/60 px-3 py-2 text-sm font-medium text-purple-200 transition-colors hover:border-purple-400 hover:text-white",
        isInstalled && "cursor-default opacity-60",
        className
      )}
      title={isInstalled ? "Already installed" : "Install VibeChain"}
    >
      <Download className="h-4 w-4" />
      {isInstalled ? "Installed" : label}
    </button>
  );
}
