// SECTION 07 — SELECTED WORK: project/case grid. Items: data/projects.ts
"use client";

import { useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { projects, type Project } from "@/data/projects";

function WorkCard({ project }: { project: Project }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const px = useSpring(mx, { stiffness: 60, damping: 20 });
  const py = useSpring(my, { stiffness: 60, damping: 20 });

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return;
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 6);
  };
  const onLeave = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <article className="group border-t border-line py-10 last:border-b md:py-14">
      <div
        ref={ref}
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        className="glass relative aspect-video w-full overflow-hidden"
      >
        <motion.div
          style={{ x: px, y: py }}
          className="absolute inset-[-12px] flex items-center justify-center"
        >
          {project.placeholder ? (
            <div className="text-center">
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-fg/60">
                Placeholder
              </p>
              <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.3em] text-muted/60">
                Project media pending
              </p>
              <span className="scanline absolute inset-x-0 top-0 block h-10 bg-accent/5" aria-hidden="true" />
            </div>
          ) : null}
        </motion.div>
      </div>
      <div className="mt-5 grid grid-cols-2 items-baseline gap-3 md:grid-cols-[80px_1fr_auto_auto_auto] md:gap-8">
        <span className="font-mono text-sm text-accent">{project.num}</span>
        <h3 className="font-display text-[length:var(--step-2)] font-medium tracking-tight">
          {project.title}
        </h3>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {project.sector}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {project.year}
        </span>
        <span className="font-mono text-xs uppercase tracking-widest text-muted">
          {project.services}
        </span>
      </div>
    </article>
  );
}

export default function SelectedWork() {
  return (
    <section className="border-t border-line px-6 py-28 md:px-12 md:py-36" id="work">
      <div className="mb-14 flex items-baseline justify-between">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted">
          <span className="text-accent">/</span> Selected Work
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-muted/60">
          Real projects arriving — placeholders marked
        </p>
      </div>
      {projects.map((p) => (
        <WorkCard key={p.num} project={p} />
      ))}
    </section>
  );
}
