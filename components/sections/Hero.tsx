// SECTION 01 — HERO: pinned intro over the global particle experience.
// Scroll phases (sea → building → galaxy) live in components/experience/;
// this file owns the DOM layer: loader, headline, CTAs, marquee.
// Texts: data/siteContent.ts → hero
"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import MatrixRain from "@/components/three/MatrixRain";
import Marquee from "@/components/ui/Marquee";
import { siteContent } from "@/data/siteContent";
import { experience, onExperienceReady } from "@/components/experience/state";
import { HERO_SCROLL_VH } from "@/components/experience/phases";

const SNIPPET_POSITIONS = [
  "left-[6%] top-[26%]",
  "right-[8%] top-[30%] hidden md:block",
  "left-[10%] top-[58%] hidden md:block",
  "right-[6%] top-[64%]",
  "left-[16%] bottom-[24%] hidden md:block",
  "right-[14%] top-[46%] hidden lg:block",
];

const BOOT_LINE_DELAY = 620; // ms between boot log lines starting to type
const BOOT_CHAR_MS = 22;
const EXIT_MS = 850;

function useLoader(reduced: boolean, mounted: boolean) {
  const [pct, setPct] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [phase, setPhase] = useState<"loading" | "exiting" | "gone">("loading");

  useEffect(() => {
    if (!mounted) return;
    const seen = sessionStorage.getItem("modd-boot") === "1";
    const minMs = reduced ? 900 : seen ? 1500 : 4500;
    const maxMs = 8000;
    const start = performance.now();
    let finished = false;
    let ready = false;
    let raf = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Fake-but-synced counter: creeps toward 92, snaps to 100 on finish.
    const counter = { v: 0 };
    const tween = gsap.to(counter, {
      v: 92,
      duration: minMs / 1000,
      ease: "power2.out",
      onUpdate: () => setPct(Math.round(counter.v)),
    });

    const finish = () => {
      if (finished) return;
      finished = true;
      tween.kill();
      setPct(100);
      sessionStorage.setItem("modd-boot", "1");
      timers.push(setTimeout(() => setPhase("exiting"), 300));
      timers.push(setTimeout(() => setPhase("gone"), 300 + EXIT_MS));
    };
    const tryFinish = () => {
      const el = performance.now() - start;
      if ((ready && el >= minMs) || el >= maxMs) finish();
    };

    const offReady = onExperienceReady(() => {
      ready = true;
      tryFinish();
    });
    timers.push(setTimeout(tryFinish, minMs + 20));
    timers.push(setTimeout(finish, maxMs)); // hard cap — never stuck at 95%

    // Elapsed ticker drives the type-on boot log (~25fps, loader-only).
    let lastTick = 0;
    const tick = (now: number) => {
      if (finished) return;
      if (now - lastTick > 40) {
        lastTick = now;
        setElapsed(now - start);
      }
      raf = requestAnimationFrame(tick);
    };
    if (!reduced) raf = requestAnimationFrame(tick);

    return () => {
      tween.kill();
      offReady();
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
    };
  }, [mounted, reduced]);

  return { pct, elapsed, phase };
}

export default function Hero() {
  const { hero } = siteContent;
  const sectionRef = useRef<HTMLElement>(null);
  const [mounted, setMounted] = useState(false);
  const [reduced, setReduced] = useState(false);
  const [rainSize, setRainSize] = useState(28);

  useEffect(() => {
    setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    setRainSize(window.innerWidth >= 768 ? 44 : 28);
    setMounted(true);
  }, []);

  const { pct, elapsed, phase } = useLoader(reduced, mounted);

  // Scroll-scrubbed DOM sequence + the experience's single progress source.
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
      // reduced motion: hold the stable three-quarter holographic building
      experience.hero = 0.55;
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
            experience.hero = self.progress;
          },
        },
      });

      // ambient code fragments live only in the sea phase
      tl.fromTo(
        ".hero-code",
        { autoAlpha: 0, y: 8 },
        { autoAlpha: 0.85, y: 0, stagger: 0.008, duration: 0.06 },
        0.01
      );
      tl.to(".hero-hint", { autoAlpha: 0, duration: 0.04 }, 0.05);
      tl.to(".hero-code", { autoAlpha: 0, stagger: 0.006, duration: 0.08 }, 0.3);

      // headline rises out of its clip masks from behind the finished
      // building's roofline — building first, then the words
      tl.fromTo(
        ".hero-l1",
        { yPercent: 118 },
        { yPercent: 0, duration: 0.12, ease: "power2.out" },
        0.4
      );
      tl.fromTo(
        ".hero-l2",
        { yPercent: 118 },
        { yPercent: 0, duration: 0.12, ease: "power2.out" },
        0.46
      );
      tl.fromTo(
        ".hero-sub",
        { autoAlpha: 0, y: 22 },
        { autoAlpha: 1, y: 0, duration: 0.06, ease: "power1.out" },
        0.56
      );
      tl.fromTo(
        ".hero-ctas",
        { autoAlpha: 0, y: 26 },
        { autoAlpha: 1, y: 0, duration: 0.06, ease: "power1.out" },
        0.6
      );
      tl.fromTo(
        ".hero-marquee",
        { autoAlpha: 0 },
        { autoAlpha: 1, duration: 0.05 },
        0.63
      );
      // everything bows out while the building dissolves into the galaxy
      tl.to(
        ".hero-stage",
        { autoAlpha: 0, y: -40, duration: 0.12, ease: "power1.in" },
        0.7
      );
    }, el);

    return () => ctx.revert();
  }, [mounted, reduced]);

  const bootLines = hero.loader.lines;

  return (
    <section
      ref={sectionRef}
      className="relative"
      style={{ height: reduced ? "100vh" : `${HERO_SCROLL_VH}vh` }}
      id="top"
    >
      <div className={`${reduced ? "relative min-h-screen" : "sticky top-0 h-screen"} overflow-hidden`}>
        <div className="hero-stage absolute inset-0">
          {/* Headline — each line reveals through its own clip mask */}
          <div className="absolute inset-x-0 top-[10vh] z-10 px-6 text-center md:top-[11vh]">
            <h1 className="font-display leading-[0.98] tracking-tight">
              <span className="block overflow-hidden pb-[0.06em]">
                <span className="hero-l1 block text-[length:var(--step-3)] font-medium will-change-transform">
                  {hero.line1}
                </span>
              </span>
              <span className="block overflow-hidden pb-[0.12em]">
                <span className="hero-l2 block will-change-transform">
                  <span className="font-[family-name:var(--font-instrument-serif)] text-[calc(var(--step-display)*1.22)] italic leading-[0.9] tracking-normal text-fg">
                    Artist
                  </span>
                  <span className="text-[length:var(--step-display)] font-bold">
                    {" "}
                    + <span className="text-accent">AI.</span>
                  </span>
                </span>
              </span>
            </h1>
          </div>

          {/* Floating code fragments — sea-phase ambience */}
          <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10">
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

          {/* Subline, CTAs, marquee */}
          <div className="absolute inset-x-0 bottom-0 z-20">
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
                  className="glass group inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-mono text-xs uppercase tracking-widest text-fg transition-colors hover:border-accent hover:text-accent active:translate-y-px"
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
            <div className="hero-hint absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 flex-col items-center gap-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-muted">
                Scroll
              </span>
              <span className="h-8 w-px bg-accent/60" aria-hidden="true" />
            </div>
          )}
        </div>

        {/* Boot loader — min 4.5s cinematic, 8s hard cap, session-aware */}
        {phase !== "gone" && (
          <div
            role="status"
            aria-live="polite"
            className={`absolute inset-0 z-40 flex flex-col items-center justify-center bg-bg transition-all ease-out ${
              phase === "exiting" ? "scale-[1.05] opacity-0 blur-md" : "opacity-100"
            }`}
            style={{ transitionDuration: `${EXIT_MS}ms` }}
          >
            <span className="sr-only">Loading the MODD-AI creative system</span>
            {mounted && <MatrixRain fontSize={rainSize} className="opacity-35" />}
            <p className="relative font-display text-4xl font-bold tracking-tight md:text-6xl">
              {hero.loader.title}
            </p>
            <p className="relative mt-4 font-mono text-xs uppercase tracking-[0.4em] text-muted md:text-sm">
              {hero.loader.caption}
            </p>
            {/* Boot log — lines type on in sequence */}
            <div
              className="relative mt-10 min-h-44 w-[min(88vw,34rem)] text-left font-mono text-sm leading-8 text-muted md:text-base"
              aria-hidden="true"
            >
              {bootLines.map((line, i) => {
                const chars = reduced
                  ? line.length
                  : Math.max(0, Math.floor((elapsed - i * BOOT_LINE_DELAY) / BOOT_CHAR_MS));
                if (chars <= 0) return null;
                const done = chars >= line.length;
                return (
                  <p key={line} style={{ textShadow: "0 1px 10px rgba(3,3,3,0.95)" }}>
                    <span className="text-accent">›</span> {line.slice(0, chars)}
                    {!done && <span className="blink text-accent">▌</span>}
                  </p>
                );
              })}
            </div>
            <p className="absolute bottom-10 right-8 font-mono text-lg text-accent tabular-nums md:right-12">
              {String(Math.min(pct, 100)).padStart(2, "0")}%
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
