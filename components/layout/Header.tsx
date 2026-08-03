"use client";

import { siteContent } from "@/data/siteContent";

const links = [
  { label: "Work", href: "#work" },
  { label: "Services", href: "#services" },
  { label: "Process", href: "#process" },
  { label: "Contact", href: "#contact" },
];

export default function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 mix-blend-difference">
      <nav
        aria-label="Main navigation"
        className="flex items-center justify-between px-6 py-5 md:px-12"
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
