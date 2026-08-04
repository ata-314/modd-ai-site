// SECTION 05 — BEFORE/AFTER: transformation slider examples. Items: data/transformations.ts
"use client";

import { useState } from "react";
import Image from "next/image";
import { comparisons, type ComparisonSide } from "@/data/transformations";

function Side({ side, tone }: { side: ComparisonSide; tone: "before" | "after" }) {
  if (side.src) {
    return (
      <Image
        src={side.src}
        alt={side.label}
        fill
        sizes="100vw"
        className="object-cover"
      />
    );
  }
  // Distinct placeholder looks so the slider is demonstrable before media:
  // "before" = flat blueprint grid, "after" = lit lime-tinted frame.
  return (
    <div
      className={`absolute inset-0 ${
        tone === "before" ? "bg-[#0b0e11]" : "bg-[#0a0c06]"
      }`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          backgroundImage:
            tone === "before"
              ? "repeating-linear-gradient(to right, rgba(150,157,163,0.12) 0 1px, transparent 1px 36px), repeating-linear-gradient(to bottom, rgba(150,157,163,0.12) 0 1px, transparent 1px 36px)"
              : "repeating-linear-gradient(to right, rgba(197,255,33,0.10) 0 1px, transparent 1px 36px), repeating-linear-gradient(to bottom, rgba(197,255,33,0.10) 0 1px, transparent 1px 36px)",
        }}
      />
      <span className="absolute left-4 top-4 font-mono text-[10px] uppercase tracking-[0.25em] text-fg/60">
        {side.label} · placeholder
      </span>
    </div>
  );
}

function ComparisonSlider({ comparison }: { comparison: (typeof comparisons)[number] }) {
  const [pos, setPos] = useState(50);

  return (
    <figure>
      <div className="brackets relative aspect-video w-full select-none overflow-hidden bg-panel">
        {/* BEFORE — full frame */}
        <Side side={comparison.before} tone="before" />
        {/* AFTER — clipped to the right of the divider */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ clipPath: `inset(0 0 0 ${pos}%)` }}
        >
          <Side side={comparison.after} tone="after" />
        </div>
        {/* Divider + handle */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 z-10 w-px bg-accent"
          style={{ left: `${pos}%` }}
        >
          <span className="absolute top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-accent bg-bg font-mono text-[10px] text-accent">
            ↔
          </span>
        </div>
        {/* Invisible range input drives the divider — keyboard accessible */}
        <input
          type="range"
          min={0}
          max={100}
          value={pos}
          onChange={(e) => setPos(Number(e.target.value))}
          aria-label={`${comparison.title} — before/after comparison slider`}
          className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
        />
      </div>
      <figcaption className="mt-4 flex items-baseline justify-between">
        <span className="font-display text-[length:var(--step-1)] font-medium tracking-tight">
          {comparison.title}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-muted/60">
          drag · media pending
        </span>
      </figcaption>
    </figure>
  );
}

export default function BeforeAfter() {
  return (
    <section className="border-t border-line px-6 py-28 md:px-12 md:py-36" id="before-after">
      <p className="mb-14 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        <span className="text-accent">/</span> Before → After
      </p>
      <div className="space-y-20">
        {comparisons.map((c) => (
          <ComparisonSlider key={c.id} comparison={c} />
        ))}
      </div>
    </section>
  );
}
