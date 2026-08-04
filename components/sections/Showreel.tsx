// SECTION 02 — SHOWREEL: growing video frame (placeholder until real reel). Config: data/siteContent.ts → showreel
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { siteContent } from "@/data/siteContent";

// Conos-style reveal: the reel starts as a small centered card and grows to
// near-full width as you scroll. Scrubbed — the user owns the motion.
export default function Showreel() {
  const { showreel } = siteContent;
  const sectionRef = useRef<HTMLElement>(null);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const prm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    setReduced(prm);
    if (prm) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".reel-frame",
        { scale: 0.42, yPercent: 6 },
        {
          scale: 1,
          yPercent: 0,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "center center",
            scrub: 0.4,
          },
        }
      );
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="overflow-hidden border-t border-line px-4 py-24 md:py-32"
      aria-label="Showreel"
    >
      <div
        className={`reel-frame brackets relative mx-auto aspect-video w-full max-w-6xl origin-center bg-panel ${
          reduced ? "" : "will-change-transform"
        }`}
      >
        {showreel.src ? (
          <video
            className="h-full w-full object-cover"
            src={showreel.src}
            poster={showreel.poster || undefined}
            muted
            loop
            playsInline
            autoPlay
            aria-label={showreel.label}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="scanline absolute inset-x-0 top-0 block h-10 bg-accent/5" aria-hidden="true" />
            <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg/60">
              {showreel.placeholderNote}
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.25em] text-muted/60">
              drop reel url into data/siteContent.ts
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
