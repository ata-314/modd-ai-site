"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SceneFallback from "@/components/three/SceneFallback";
import { siteContent } from "@/data/siteContent";

const BuildingScene = dynamic(() => import("@/components/three/BuildingScene"), {
  ssr: false,
});

const SNIPPET_POSITIONS = [
  "left-[6%] top-[18%]",
  "right-[8%] top-[24%] hidden md:block",
  "left-[10%] top-[58%] hidden md:block",
  "right-[6%] top-[64%]",
  "left-[38%] top-[12%] hidden lg:block",
  "right-[30%] bottom-[18%] hidden lg:block",
  "left-[16%] bottom-[24%] hidden md:block",
  "right-[14%] top-[42%] hidden lg:block",
];

export default function Hero() {
  const { hero } = siteContent;
  const sectionRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [useWebGL, setUseWebGL] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [ready, setReady] = useState(false);
  const [pct, setPct] = useState(0);
  const [loaderGone, setLoaderGone] = useState(false);

  useEffect(() => {
    const prm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const small = window.innerWidth < 820;
    setReduced(prm);
    setUseWebGL(!prm && !coarse && !small);
    setMounted(true);
  }, []);

  // Loader counter: creeps to 95, snaps to 100 when assets are ready.
  useEffect(() => {
    if (!mounted) return;
    if (!useWebGL) {
      setReady(true);
      return;
    }
    const state = { v: 0 };
    const tween = gsap.to(state, {
      v: 95,
      duration: 1.6,
      ease: "power2.out",
      onUpdate: () => setPct(Math.round(state.v)),
    });
    return () => {
      tween.kill();
    };
  }, [mounted, useWebGL]);

  useEffect(() => {
    if (!ready) return;
    setPct(100);
    const t = setTimeout(() => setLoaderGone(true), 450);
    return () => clearTimeout(t);
  }, [ready]);

  const onSceneReady = useCallback(() => setReady(true), []);

  // Scroll-scrubbed sequence.
  useEffect(() => {
    if (!mounted) return;
    const el = sectionRef.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);

    if (reduced) {
      gsap.set(el.querySelectorAll(".hero-seq"), { autoAlpha: 1 });
      progressRef.current = 1;
      return;
    }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: el,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.5,
          onUpdate: (self) => {
            progressRef.current = self.progress;
          },
        },
      });

      tl.fromTo(
        ".hero-code",
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 0.85, y: 0, stagger: 0.012, duration: 0.08 },
        0
      );
      tl.to(".hero-hint", { autoAlpha: 0, duration: 0.06 }, 0.08);
      tl.to(".hero-code", { autoAlpha: 0, stagger: 0.008, duration: 0.1 }, 0.55);
      tl.fromTo(
        ".hero-l1",
        { autoAlpha: 0, y: 46 },
        { autoAlpha: 1, y: 0, duration: 0.12, ease: "power2.out" },
        0.5
      );
      tl.fromTo(
        ".hero-l2",
        { autoAlpha: 0, y: 54, scale: 0.97 },
        { autoAlpha: 1, y: 0, scale: 1, duration: 0.13, ease: "power2.out" },
        0.72
      );
      tl.fromTo(
        ".hero-sub",
        { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.1 },
        0.86
      );

      if (!useWebGL) {
        tl.fromTo(
          ".hero-fallback-img",
          { yPercent: 6, scale: 1.04, autoAlpha: 0.4 },
          { yPercent: -2, scale: 1, autoAlpha: 1, duration: 0.7, ease: "power1.out" },
          0.05
        );
      }
    }, el);

    return () => ctx.revert();
  }, [mounted, reduced, useWebGL]);

  const sectionHeight = reduced ? "min-h-screen" : "h-[240vh]";

  return (
    <section ref={sectionRef} className={`relative ${sectionHeight}`} id="top">
      <div className={`${reduced ? "relative min-h-screen" : "sticky top-0 h-screen"} overflow-hidden bg-bg`}>
        {/* Scene */}
        {mounted && useWebGL && !reduced && (
          <BuildingScene
            imageUrl={hero.building.texture}
            progressRef={progressRef}
            onReady={onSceneReady}
          />
        )}
        {mounted && (!useWebGL || reduced) && (
          <div className="hero-fallback-img absolute inset-0">
            <SceneFallback />
          </div>
        )}

        {/* Floating code fragments */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          {hero.codeSnippets.map((snip, i) => (
            <span
              key={snip}
              className={`hero-code hero-seq absolute font-mono text-[11px] tracking-wide opacity-0 ${
                SNIPPET_POSITIONS[i % SNIPPET_POSITIONS.length]
              } ${i % 3 === 0 ? "text-accent/70" : "text-muted/80"}`}
            >
              {snip}
            </span>
          ))}
        </div>

        {/* Headline block */}
        <div className="absolute inset-x-0 bottom-0 px-6 pb-14 md:px-12 md:pb-20">
          <h1 className="font-display leading-[0.98] tracking-tight">
            <span className="hero-l1 hero-seq block text-[length:var(--step-3)] font-medium opacity-0">
              {hero.line1}
            </span>
            <span className="hero-l2 hero-seq block text-[length:var(--step-display)] font-bold text-accent opacity-0">
              {hero.line2}
            </span>
          </h1>
          <div className="hero-sub hero-seq mt-6 flex flex-wrap items-center gap-6 opacity-0">
            <p className="max-w-md text-[length:var(--step-0)] text-muted">
              {hero.subline}
            </p>
            <div className="flex gap-3">
              <a
                href={hero.ctaPrimary.href}
                className="border border-line bg-fg px-5 py-3 font-mono text-xs uppercase tracking-widest text-bg transition-colors hover:bg-accent hover:text-black focus-visible:bg-accent active:translate-y-px"
              >
                {hero.ctaPrimary.label}
              </a>
              <a
                href={hero.ctaSecondary.href}
                className="border border-line px-5 py-3 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:border-accent hover:text-accent active:translate-y-px"
              >
                {hero.ctaSecondary.label}
              </a>
            </div>
          </div>
        </div>

        {/* Scroll hint */}
        {!reduced && (
          <div className="hero-hint absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 md:bottom-8">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Scroll
            </span>
            <span className="h-8 w-px bg-accent/60" aria-hidden="true" />
          </div>
        )}

        {/* Loader */}
        {!loaderGone && (
          <div
            className={`absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg transition-opacity duration-500 ${
              ready ? "opacity-0" : "opacity-100"
            }`}
            aria-hidden={ready}
          >
            <p className="font-display text-2xl font-bold tracking-tight">
              {hero.loader.title}
            </p>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.35em] text-muted">
              {hero.loader.caption}
            </p>
            <p className="mt-6 font-mono text-sm text-accent tabular-nums">
              {String(Math.min(pct, 100)).padStart(2, "0")}%
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
