"use client";

import { ReactNode } from "react";
import { useFadeInOnScroll } from "@/hooks/useFadeInOnScroll";
import { cn } from "@/lib/utils";

interface FadeInProps {
  children: ReactNode;
  className?: string;
  delayMs?: number;
}

/** Fades + slides a section up once it scrolls into view. Respects reduced-motion via CSS. */
export function FadeIn({ children, className, delayMs = 0 }: FadeInProps) {
  const { ref, isVisible } = useFadeInOnScroll<HTMLDivElement>();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: isVisible ? `${delayMs}ms` : "0ms" }}
      className={cn(
        "transition-all duration-700 ease-out motion-reduce:transition-none",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className
      )}
    >
      {children}
    </div>
  );
}
