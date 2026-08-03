"use client";

import Image from "next/image";
import { siteContent } from "@/data/siteContent";

// Lightweight hero visual for mobile / low-power / reduced-motion contexts.
// No WebGL — an optimized image with a faint digital grid overlay.
export default function SceneFallback({ parallaxRef }: { parallaxRef?: React.RefObject<HTMLDivElement | null> }) {
  const { building } = siteContent.hero;
  return (
    <div className="absolute inset-0 flex items-center justify-center overflow-hidden" aria-hidden="false">
      <div ref={parallaxRef} className="relative w-[130%] max-w-[900px] will-change-transform">
        <Image
          src={building.fallbackMobile}
          alt={building.alt}
          width={1200}
          height={500}
          priority
          sizes="(max-width: 900px) 130vw, 900px"
          className="h-auto w-full opacity-90"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "repeating-linear-gradient(to right, rgba(197,255,33,0.05) 0 1px, transparent 1px 28px), repeating-linear-gradient(to bottom, rgba(197,255,33,0.05) 0 1px, transparent 1px 28px)",
            maskImage: `url(${building.fallbackMobile})`,
            maskSize: "100% 100%",
            WebkitMaskImage: `url(${building.fallbackMobile})`,
            WebkitMaskSize: "100% 100%",
          }}
        />
      </div>
    </div>
  );
}
