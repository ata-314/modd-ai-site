"use client";

import { useEffect, useRef } from "react";

// Neuron web behind everything below the hero. A tall field of neurons is
// parallax-mapped to scroll, so the network keeps unfolding all the way to
// the footer. Edges fire electric pulses that can chain to neighboring
// edges; firing intensity rises while the user is actively scrolling.
// Fixed canvas at z-0 — the hero's opaque background hides it until the
// hero scrolls away, then it fades in.
export default function NeuralBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    const PARALLAX = 0.85;
    let raf = 0;
    let w = 0;
    let h = 0;
    let worldH = 0;
    let heroH = 0;

    interface Node {
      x: number;
      y: number; // world y (0 .. worldH)
      r: number;
      ph: number;
      accent: boolean;
    }
    interface Edge {
      a: number;
      b: number;
    }
    interface Pulse {
      edge: number;
      t: number; // 0 → 1 along the edge
      speed: number;
      flip: boolean; // travel b → a instead of a → b
    }
    let nodes: Node[] = [];
    let edges: Edge[] = [];
    let adjacency: number[][] = [];
    let pulses: Pulse[] = [];

    let scrollY = 0;
    let scrollVel = 0;
    let lastScrollY = 0;

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const docH = document.documentElement.scrollHeight;
      heroH = document.getElementById("top")?.offsetHeight ?? h * 2.4;
      worldH = Math.max((docH - h) * PARALLAX + h, h);

      const density = coarse ? 34000 : 22000;
      const count = Math.min(Math.max(Math.round((w * worldH) / density), 60), 460);
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * worldH,
        r: 1 + Math.random() * 1.7,
        ph: Math.random() * Math.PI * 2,
        accent: Math.random() < 0.12,
      }));

      // Each neuron links to its 2 nearest peers within reach (dedup i<j).
      edges = [];
      const seen = new Set<string>();
      for (let i = 0; i < nodes.length; i++) {
        const dists: { j: number; d: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const d = dx * dx + dy * dy;
          if (d < 260 * 260) dists.push({ j, d });
        }
        dists.sort((a, b) => a.d - b.d);
        for (const { j } of dists.slice(0, 2)) {
          const key = i < j ? `${i}-${j}` : `${j}-${i}`;
          if (!seen.has(key)) {
            seen.add(key);
            edges.push({ a: Math.min(i, j), b: Math.max(i, j) });
          }
        }
      }
      adjacency = nodes.map(() => []);
      edges.forEach((e, idx) => {
        adjacency[e.a].push(idx);
        adjacency[e.b].push(idx);
      });
      pulses = [];
    };

    const spawnPulse = (edgeIdx: number, flip: boolean) => {
      if (pulses.length >= 40) return;
      pulses.push({ edge: edgeIdx, t: 0, speed: 0.9 + Math.random() * 1.1, flip });
    };

    let lastT = 0;
    let spawnAcc = 0;
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      const t = now / 1000;
      const dt = Math.min(t - lastT || 0.016, 0.05);
      lastT = t;

      scrollVel = scrollVel * 0.92 + Math.abs(scrollY - lastScrollY) * 0.08;
      lastScrollY = scrollY;

      // Fade in as the hero's pinned screen scrolls away.
      const fade = Math.min(Math.max((scrollY - (heroH - h * 1.25)) / (h * 0.7), 0), 1);
      ctx.clearRect(0, 0, w, h);
      if (fade <= 0.01) return;

      const offset = scrollY * PARALLAX;
      const inView = (y: number) => y > offset - 60 && y < offset + h + 60;

      // Synapse lines.
      ctx.lineWidth = 1;
      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        if (!inView(a.y) && !inView(b.y)) continue;
        ctx.strokeStyle = `rgba(150, 157, 163, ${0.055 * fade})`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y - offset);
        ctx.lineTo(b.x, b.y - offset);
        ctx.stroke();
      }

      // Neurons breathe.
      for (const n of nodes) {
        if (!inView(n.y)) continue;
        const breathe = 0.5 + 0.5 * Math.sin(t * 1.2 + n.ph);
        const alpha = (0.08 + breathe * 0.1) * fade;
        ctx.fillStyle = n.accent
          ? `rgba(197, 255, 33, ${alpha * 1.4})`
          : `rgba(244, 243, 238, ${alpha})`;
        ctx.beginPath();
        ctx.arc(n.x, n.y - offset, n.r + breathe * 0.5, 0, Math.PI * 2);
        ctx.fill();
      }

      if (!reduced) {
        // Firing rate: calm baseline, surges while scrolling.
        const rate = 1.1 + Math.min(scrollVel * 0.25, 5);
        spawnAcc += dt * rate;
        while (spawnAcc > 1) {
          spawnAcc -= 1;
          const visibleEdges: number[] = [];
          for (let i = 0; i < edges.length; i++) {
            if (inView(nodes[edges[i].a].y)) visibleEdges.push(i);
          }
          if (visibleEdges.length) {
            spawnPulse(
              visibleEdges[Math.floor(Math.random() * visibleEdges.length)],
              Math.random() < 0.5
            );
          }
        }

        // Electric pulses travel synapses, glow, and sometimes chain onward.
        ctx.save();
        ctx.shadowColor = "rgba(197, 255, 33, 0.9)";
        ctx.shadowBlur = 10;
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.t += dt * p.speed;
          const e = edges[p.edge];
          const from = p.flip ? nodes[e.b] : nodes[e.a];
          const to = p.flip ? nodes[e.a] : nodes[e.b];
          if (p.t >= 1) {
            const arrival = p.flip ? e.a : e.b;
            const next = adjacency[arrival].filter((idx) => idx !== p.edge);
            if (next.length && Math.random() < 0.4) {
              const nextEdge = next[Math.floor(Math.random() * next.length)];
              spawnPulse(nextEdge, edges[nextEdge].b === arrival);
            }
            pulses.splice(i, 1);
            continue;
          }
          const x = from.x + (to.x - from.x) * p.t;
          const y = from.y + (to.y - from.y) * p.t - offset;
          if (y < -40 || y > h + 40) continue;

          // Lit tail behind the spark.
          const tail = Math.max(p.t - 0.22, 0);
          const tx = from.x + (to.x - from.x) * tail;
          const ty = from.y + (to.y - from.y) * tail - offset;
          const grad = ctx.createLinearGradient(tx, ty, x, y);
          grad.addColorStop(0, "rgba(197, 255, 33, 0)");
          grad.addColorStop(1, `rgba(197, 255, 33, ${0.55 * fade})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(tx, ty);
          ctx.lineTo(x, y);
          ctx.stroke();

          ctx.fillStyle = `rgba(220, 255, 120, ${0.9 * fade})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
    };

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onResize = () => build();

    build();
    onScroll();
    raf = requestAnimationFrame(draw);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <canvas ref={canvasRef} className="h-full w-full" />
    </div>
  );
}
