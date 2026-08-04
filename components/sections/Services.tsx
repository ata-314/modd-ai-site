// SECTION 04 — SERVICES: expandable service list (accordion). Items: data/services.ts
"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { services } from "@/data/services";

export default function Services() {
  const [open, setOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <section className="border-t border-line px-6 py-28 md:px-12 md:py-36" id="services">
      <p className="mb-14 font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
        <span className="text-accent">/</span> Services
      </p>
      <ul>
        {services.map((s) => {
          const isOpen = open === s.num;
          const isHover = hovered === s.num;
          return (
            <li key={s.num} className="border-t border-line last:border-b">
              <div
                className="relative"
                onMouseEnter={() => setHovered(s.num)}
                onMouseLeave={() => setHovered(null)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={`service-detail-${s.num}`}
                  onClick={() => setOpen(isOpen ? null : s.num)}
                  className="group grid w-full grid-cols-[auto_1fr_auto] items-baseline gap-4 py-8 text-left transition-colors hover:bg-panel focus-visible:bg-panel md:grid-cols-[120px_1fr_minmax(0,320px)_auto] md:gap-8 md:py-10"
                >
                  <span className="font-mono text-[length:var(--step-2)] font-medium text-accent">
                    {s.num}
                  </span>
                  <span>
                    <span className="font-display block text-[length:var(--step-2)] font-medium tracking-tight">
                      {s.title}
                    </span>
                    <span className="mt-1 block max-w-md text-sm text-muted">
                      {s.description}
                    </span>
                  </span>
                  <span className="hidden md:block" aria-hidden="true">
                    {/* Hover preview — placeholder until real media arrives */}
                    <AnimatePresence>
                      {isHover && (
                        <motion.span
                          initial={{ opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 6 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          className="brackets relative block h-24 overflow-hidden bg-panel"
                        >
                          <span className="scanline absolute inset-x-0 top-0 block h-6 bg-accent/10" />
                          <span className="absolute inset-0 flex items-center justify-center font-mono text-[10px] uppercase tracking-[0.25em] text-muted">
                            Preview · Placeholder
                          </span>
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </span>
                  <span
                    aria-hidden="true"
                    className={`font-mono text-xl text-muted transition-transform duration-300 group-hover:text-accent ${
                      isOpen ? "rotate-45" : ""
                    }`}
                  >
                    +
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={`service-detail-${s.num}`}
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="grid gap-4 pb-10 md:grid-cols-[120px_1fr] md:gap-8">
                        <span aria-hidden="true" />
                        <div className="max-w-2xl">
                          <p className="text-muted">{s.detail}</p>
                          <a
                            href="#contact"
                            className="mt-4 inline-block font-mono text-xs uppercase tracking-widest text-accent underline-offset-4 hover:underline"
                          >
                            Start a project →
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
