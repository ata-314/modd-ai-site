"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SceneFallback from "@/components/three/SceneFallback";
import CodeSeaCanvas from "@/components/three/CodeSeaCanvas";
import Marquee from "@/components/ui/Marquee";
import { siteContent } from "@/data/siteContent";

const BuildingScene = dynamic(() => import("@/components/three/BuildingScene"), {
  ssr: false,
});

const SNIPPET_POSITIONS = [
  "left-[6%] top-[26%]",
  "right-[8%] top-[30%] hidden md:block",
  "left-[10%] top-[58%] hidden md:block",
  "right-[6%] top-[64%]",
  "left-[16%] bottom-[24%] hidden md:block",
  "right-[14%] top-[46%] hidden lg:block",
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
      gsap.set(el.querySelectorAll(".hero-seq, .hero-l1, .hero-l2"), {
        autoAlpha: 1,
        yPercent: 0,
        y: 0,
      });
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

      // Headline lines start physically low — hidden by the building's
      // pixels (this layer sits behind the canvas) — and rise out from
      // behind the roofline as scroll progresses.
      tl.fromTo(
        ".hero-l1",
        { y: "36vh" },
        { y: 0, duration: 0.2, ease: "power2.out" },
        0.44
      );
      tl.fromTo(
        ".hero-l2",
        { y: "44vh" },
        { y: 0, duration: 0.22, ease: "power2.out" },
        0.58
      );
      tl.fromTo(
        ".hero-sub",
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.09, ease: "power1.out" },
        0.8
      );
      tl.fromTo(
        ".hero-ctas",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.09, ease: "power1.out" },
        0.85
      );
      tl.fromTo(
        ".hero-marquee",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.08 },
        0.9
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
        {/* Layer 0 — flowing code sea (behind everything) */}
        <div className="absolute inset-0 z-0">
          <CodeSeaCanvas />
        </div>

        {/* Layer 1 — headline, sits BEHIND the building canvas so lines
            emerge from behind the roofline */}
        <div className="absolute inset-x-0 top-[8vh] z-10 px-6 text-center md:top-[9vh]">
          <h1 className="font-display leading-[0.98] tracking-tight">
            <span className="hero-l1 block text-[length:var(--step-3)] font-medium will-change-transform">
              {hero.line1}
            </span>
            <span className="hero-l2 block pb-[0.1em] will-change-transform">
              <span className="font-[family-name:var(--font-instrument-serif)] text-[calc(var(--step-display)*1.22)] italic leading-[0.9] tracking-normal text-fg">
                Artist
              </span>
              <span className="text-[length:var(--step-display)] font-bold">
                {" "}
                + <span className="text-accent">AI.</span>
              </span>
            </span>
          </h1>
        </div>

        {/* Layer 2 — WebGL building (occludes the headline while it rises) */}
        <div className="pointer-events-none absolute inset-0 z-20">
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
          {/* Floating code fragments — same depth as the building */}
          <div aria-hidden="true" className="absolute inset-0">
            {hero.codeSnippets.slice(0, 6).map((snip, i) => (
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
        </div>

        {/* Layer 3 — subline, pill CTAs, marquee (above the building) */}
        <div className="absolute inset-x-0 bottom-0 z-30">
          <div className="px-6 pb-8 text-center">
            <p
              className="hero-sub hero-seq mx-auto max-w-md text-[length:var(--step-0)] text-fg/75 opacity-0"
              style={{ textShadow: "0 1px 12px rgba(3,3,3,0.9)" }}
            >
              {hero.subline}
            </p>
            <div className="hero-ctas hero-seq mt-6 flex flex-wrap items-center justify-center gap-4 opacity-0">
              <a
                href={hero.ctaPrimary.href}
                className="group inline-flex items-center gap-2 rounded-full bg-fg px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-bg transition-colors hover:bg-accent hover:text-black focus-visible:bg-accent focus-visible:text-black active:translate-y-px"
              >
                {hero.ctaPrimary.label}
                <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </a>
              <a
                href={hero.ctaSecondary.href}
                className="group inline-flex items-center gap-2 rounded-full border border-line bg-bg/60 px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-fg backdrop-blur-sm transition-colors hover:border-accent hover:text-accent active:translate-y-px"
              >
                {hero.ctaSecondary.label}
                <span aria-hidden="true" className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  ↗
                </span>
              </a>
            </div>
          </div>
          <div className="hero-marquee hero-seq opacity-0">
            <Marquee items={hero.marquee} />
          </div>
        </div>

        {/* Scroll hint */}
        {!reduced && (
          <div className="hero-hint absolute bottom-24 left-1/2 z-30 flex -translate-x-1/2 flex-col items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
              Scroll
            </span>
            <span className="h-8 w-px bg-accent/60" aria-hidden="true" />
          </div>
        )}

        {/* Loader */}
        {!loaderGone && (
          <div
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg transition-opacity duration-500 ${
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
            {/* Boot log — lines "load" with the progress counter */}
            <div
              className="mt-8 h-32 w-72 text-left font-mono text-[11px] leading-6 text-muted"
              aria-hidden="true"
            >
              {hero.loader.lines
                .slice(
                  0,
                  Math.max(1, Math.ceil((pct / 100) * hero.loader.lines.length))
                )
                .map((line, i, arr) => (
                  <p key={line}>
                    <span className="text-accent">›</span> {line}
                    {i === arr.length - 1 && pct < 100 && (
                      <span className="blink text-accent">▌</span>
                    )}
                  </p>
                ))}
            </div>
            <p className="mt-2 font-mono text-sm text-accent tabular-nums">
              {String(Math.min(pct, 100)).padStart(2, "0")}%
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
