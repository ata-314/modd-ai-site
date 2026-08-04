// PAGE PART — Fixed top navigation. Transparent over the hero, condenses
// into a centered glass capsule as the page scrolls. Nav labels below.
"use client";

import { useEffect, useRef, useState } from "react";
import { siteContent } from "@/data/siteContent";

const links = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrolled(window.scrollY > window.innerHeight * 0.4);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className="fixed inset-x-0 top-0 z-40 flex justify-center px-4 pt-4">
      <nav
        aria-label="Main navigation"
        className={`flex items-center gap-6 rounded-full px-6 transition-all duration-700 ease-out md:gap-10 ${
          scrolled ? "glass py-3" : "w-full max-w-none justify-between bg-transparent py-4 md:px-8"
        }`}
      >
        <a
          href="#top"
          className="font-display text-sm font-bold tracking-tight text-fg"
          aria-label={`${siteContent.brand} — back to top`}
        >
          MODD<span className="text-accent">-</span>AI
        </a>
        <ul className="flex items-center gap-5 md:gap-8">
          {links.map((l) => (
            <li key={l.href} className={l.label === "Process" ? "hidden sm:block" : ""}>
              <a
                href={l.href}
                className="font-mono text-[11px] uppercase tracking-[0.2em] text-fg/80 transition-colors hover:text-accent"
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
