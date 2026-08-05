// SECTION 03 — WORK REEL: auto-scrolling slider of vertical 9:16 work
// videos. Items: data/reels.ts (set `src` when real media lands).
"use client";

import { reels } from "@/data/reels";

export default function WorkReel() {
  const track = [...reels, ...reels]; // doubled → seamless -50% loop

  return (
    <section className="overflow-hidden border-t border-line py-24 md:py-32" id="reels">
      <p className="mb-12 px-6 font-mono text-[11px] uppercase tracking-[0.3em] text-muted md:px-12">
        <span className="text-accent">/</span> Selected Reels
      </p>
      <div
        className="group relative"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 8%, black 92%, transparent)",
        }}
      >
        <div
          className="marquee-track flex w-max gap-5 px-6 group-hover:[animation-play-state:paused] md:gap-7"
          style={{ animationDuration: "48s" }}
        >
          {track.map((r, i) => (
            <figure
              key={`${r.id}-${i}`}
              className="glass relative aspect-[9/16] w-[220px] shrink-0 overflow-hidden md:w-[260px]"
              aria-hidden={i >= reels.length}
            >
              {r.src ? (
                <video
                  src={r.src}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full object-cover"
                />
              ) : (
                <div className="absolute inset-0">
                  <span className="scanline absolute inset-x-0 top-0 block h-10 bg-accent/5" aria-hidden="true" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted/70">
                      9:16 · media pending
                    </span>
                  </div>
                </div>
              )}
              <figcaption className="absolute inset-x-0 bottom-0 flex items-baseline justify-between bg-gradient-to-t from-black/70 to-transparent p-4">
                <span className="font-display text-sm font-medium">{r.title}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-accent/80">
                  {r.tag}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
