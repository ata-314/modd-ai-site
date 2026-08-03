"use client";

import { useEffect, useRef } from "react";

const CHARS = "01{}<>/;:+xyz=*#".split("");

// Flowing sea of terminal characters behind the whole hero — 2D canvas, not
// WebGL, so it can sit *behind* the headline while the building canvas sits
// in front. Waves roll slowly; characters drift and occasionally flip.
export default function CodeSeaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;

    interface Glyph {
      x: number;
      y: number;
      char: string;
      size: number;
      speed: number;
      phase: number;
      accent: boolean;
      flip: number;
    }
    let glyphs: Glyph[] = [];

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const coarse = window.matchMedia("(pointer: coarse)").matches;
      const cols = coarse ? 22 : 44;
      const rows = coarse ? 14 : 20;
      glyphs = [];
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          glyphs.push({
            x: (c / cols) * w + Math.random() * (w / cols),
            y: (r / rows) * h + Math.random() * (h / rows),
            char: CHARS[Math.floor(Math.random() * CHARS.length)],
            size: 9 + Math.random() * 3,
            speed: 6 + Math.random() * 10,
            phase: Math.random() * Math.PI * 2,
            accent: Math.random() < 0.06,
            flip: Math.random() * 1000,
          });
        }
      }
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      ctx.textBaseline = "middle";
      for (const g of glyphs) {
        // Horizontal drift + rolling vertical wave, Conos-sea style.
        const x = ((g.x + t * g.speed * 0.32) % (w + 40)) - 20;
        const wave =
          Math.sin(x * 0.008 + t * 0.5 + g.phase) * 14 +
          Math.sin(x * 0.003 - t * 0.22) * 22;
        const y = g.y + wave;
        if (Math.floor(t * 2 + g.flip) % 97 === 0) {
          g.char = CHARS[Math.floor(Math.random() * CHARS.length)];
        }
        const depth = 0.35 + 0.65 * (g.y / h);
        ctx.font = `${g.size}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = g.accent
          ? `rgba(197, 255, 33, ${0.16 * depth})`
          : `rgba(150, 157, 163, ${0.13 * depth})`;
        ctx.fillText(g.char, x, y);
      }
    };

    const loop = (now: number) => {
      if (!running) return;
      draw(now / 1000);
      raf = requestAnimationFrame(loop);
    };

    build();
    if (reduced) {
      draw(0);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      build();
      if (reduced) draw(0);
    };
    window.addEventListener("resize", onResize);

    const io = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && !document.hidden;
      if (visible && !running && !reduced) {
        running = true;
        raf = requestAnimationFrame(loop);
      } else if (!visible) {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      aria-hidden="true"
    />
  );
}
