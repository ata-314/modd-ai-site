"use client";

import { useEffect, useRef, type ElementType } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface Props {
  children: string;
  as?: ElementType;
  className?: string;
  /** word = per-word rise; line = whole block rise (more readable for paragraphs) */
  mode?: "word" | "line";
  delay?: number;
}

// Scroll-triggered text reveal. Words rise once, then stay put — no re-trigger,
// no over-fragmented motion. Reduced-motion users see the text immediately.
export default function TextReveal({
  children,
  as = "div",
  className,
  mode = "word",
  delay = 0,
}: Props) {
  // Polymorphic tag: cast keeps JSX typing simple; runtime tag is `as`.
  const Tag = as as "div";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);
    const targets =
      mode === "word" ? el.querySelectorAll<HTMLElement>(".tr-word") : [el];

    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { yPercent: mode === "word" ? 112 : 24, opacity: mode === "word" ? 1 : 0 },
        {
          yPercent: 0,
          opacity: 1,
          duration: 0.9,
          ease: "power3.out",
          stagger: mode === "word" ? 0.028 : 0,
          delay,
          scrollTrigger: { trigger: el, start: "top 86%", once: true },
        }
      );
    }, el);
    return () => ctx.revert();
  }, [mode, delay]);

  if (mode === "line") {
    return (
      <Tag ref={ref} className={className}>
        {children}
      </Tag>
    );
  }

  return (
    <Tag ref={ref} className={className} aria-label={children}>
      {children.split(" ").map((word, i) => (
        <span key={i} aria-hidden="true" className="inline-block overflow-hidden pb-[0.08em] -mb-[0.08em] align-bottom">
          <span className="tr-word inline-block will-change-transform">
            {word}
            {" "}
          </span>
        </span>
      ))}
    </Tag>
  );
}
