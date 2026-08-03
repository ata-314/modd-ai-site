"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { processStages } from "@/data/process";

// Sticky scroll story: the stage list pins while scroll progress activates
// each phase. Falls back to a static list for reduced-motion / short screens.
export default function Process() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(0);
  const [pinned, setPinned] = useState(true);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setPinned(false);
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const idx = Math.min(
          processStages.length - 1,
          Math.floor(self.progress * processStages.length)
        );
        setActive(idx);
      },
    });
    return () => st.kill();
  }, []);

  if (!pinned) {
    return (
      <section className="border-t border-line px-6 py-28 md:px-12" id="process">
        <p className="mb-14 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
          <span className="text-accent">/</span> Process
        </p>
        {processStages.map((s) => (
          <div key={s.num} className="border-t border-line py-8 last:border-b">
            <p className="font-mono text-sm text-accent">{s.num}</p>
            <h3 className="font-display mt-1 text-[length:var(--step-3)] font-medium">{s.title}</h3>
            <p className="mt-2 max-w-lg text-muted">{s.description}</p>
            <p className="mt-3 font-mono text-xs text-accent/70">{s.indicator}</p>
          </div>
        ))}
      </section>
    );
  }

  const stage = processStages[active];

  return (
    <section ref={sectionRef} className="relative h-[320vh] border-t border-line" id="process">
      <div className="sticky top-0 flex h-screen flex-col justify-center px-6 md:px-12">
        <p className="mb-10 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
          <span className="text-accent">/</span> Process
        </p>
        <div className="grid gap-10 md:grid-cols-[1fr_1.2fr] md:gap-20">
          <ol className="space-y-4" role="list">
            {processStages.map((s, i) => (
              <li
                key={s.num}
                aria-current={i === active ? "step" : undefined}
                className={`flex items-baseline gap-5 transition-all duration-500 ${
                  i === active ? "opacity-100" : "opacity-30"
                }`}
              >
                <span
                  className={`font-mono text-sm ${i === active ? "text-accent" : "text-muted"}`}
                >
                  {s.num}
                </span>
                <span
                  className={`font-display text-[length:var(--step-3)] font-medium tracking-tight ${
                    i === active ? "translate-x-2" : ""
                  } inline-block transition-transform duration-500`}
                >
                  {s.title}
                </span>
              </li>
            ))}
          </ol>
          <div className="flex flex-col justify-center">
            <div className="h-px w-16 bg-accent" aria-hidden="true" />
            <p className="mt-6 max-w-md text-[length:var(--step-1)] leading-relaxed text-fg/90">
              {stage.description}
            </p>
            <p className="mt-6 font-mono text-xs text-accent/80">{stage.indicator}</p>
            <div className="mt-10 flex gap-1" aria-hidden="true">
              {processStages.map((_, i) => (
                <span
                  key={i}
                  className={`h-px flex-1 transition-colors duration-500 ${
                    i <= active ? "bg-accent" : "bg-line"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
