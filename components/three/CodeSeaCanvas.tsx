"use client";

import { useEffect, useRef } from "react";

const CHARS = "01{}<>/;:+xyz=*#".split("");

// Perspective code ocean behind the whole hero (Conos-style). A plane of
// terminal glyphs recedes to a horizon and flows continuously TOWARD the
// viewer; glyph height rides layered sine waves, crests light up accent.
// 2D canvas with manual 3D projection — cheap, and it must stay behind the
// headline while the WebGL building canvas sits in front.
// Mouse: camera parallax + nearby glyphs part away and light up.
export default function CodeSeaCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;

    // World constants (arbitrary units; z grows toward the horizon).
    const NEAR = 70;
    const FAR = 1700;
    const CAM_HEIGHT = 130;
    const X_SPREAD = 1100;
    const FLOW_SPEED = 150; // units/s toward the viewer
    const ROWS = coarse ? 26 : 46;
    const COLS = coarse ? 16 : 34;

    const mouse = { x: -9999, y: -9999, nx: 0, ny: 0 };
    const cam = { x: 0, y: 0 }; // smoothed parallax offset

    interface Glyph {
      x: number; // world x
      char: string;
      phase: number;
      accent: boolean;
      flip: number;
    }
    interface Row {
      z: number;
      glyphs: Glyph[];
    }
    let rows: Row[] = [];

    const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

    const buildRow = (z: number): Row => {
      const glyphs: Glyph[] = [];
      for (let c = 0; c < COLS; c++) {
        glyphs.push({
          x: (c / (COLS - 1) - 0.5) * 2 * X_SPREAD + (Math.random() - 0.5) * (X_SPREAD / COLS),
          char: randomChar(),
          phase: Math.random() * Math.PI * 2,
          accent: Math.random() < 0.05,
          flip: Math.random() * 1000,
        });
      }
      return { z, glyphs };
    };

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rows = [];
      const dz = (FAR - NEAR) / ROWS;
      for (let r = 0; r < ROWS; r++) {
        rows.push(buildRow(NEAR + r * dz + Math.random() * dz * 0.5));
      }
    };

    const waveHeight = (x: number, z: number, t: number) =>
      Math.sin(x * 0.006 + t * 0.9 + z * 0.004) * 26 +
      Math.sin(z * 0.008 - t * 1.3) * 34 +
      Math.sin(x * 0.013 - t * 0.5 + z * 0.002) * 12;

    let lastT = 0;
    const draw = (t: number) => {
      const dt = Math.min(t - lastT, 0.05);
      lastT = t;
      ctx.clearRect(0, 0, w, h);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Smoothed camera parallax from normalized mouse position.
      cam.x += (mouse.nx * 90 - cam.x) * 0.04;
      cam.y += (mouse.ny * 36 - cam.y) * 0.04;

      const focal = h * 1.05;
      const horizonY = h * 0.34 + cam.y;

      // Flow toward the viewer; wrap rows back to the horizon.
      if (!reduced) {
        for (const row of rows) {
          row.z -= FLOW_SPEED * dt;
          if (row.z < NEAR) {
            row.z += FAR - NEAR;
            for (const g of row.glyphs) {
              g.char = randomChar();
              g.accent = Math.random() < 0.05;
            }
          }
        }
      }

      // Far rows first so near glyphs paint over them.
      const sorted = [...rows].sort((a, b) => b.z - a.z);
      for (const row of sorted) {
        const z = row.z;
        const scale = focal / z;
        const size = Math.min(Math.max(13 * scale, 5), 19);
        const fog = Math.max(0, Math.min(1, 1 - (z - NEAR) / (FAR - NEAR)));
        const baseA = 0.045 + fog * fog * 0.3;
        ctx.font = `${size.toFixed(1)}px ui-monospace, Menlo, monospace`;

        for (const g of row.glyphs) {
          const yWave = waveHeight(g.x, z, reduced ? 0 : t) + Math.sin(g.phase + t * 1.1) * 4;
          let sx = w / 2 + (g.x - cam.x) * scale;
          let sy = horizonY + (CAM_HEIGHT - yWave) * scale;
          if (sx < -30 || sx > w + 30 || sy < -30 || sy > h + 40) continue;

          // Cursor interaction: nearby glyphs part away and light up.
          let boost = 0;
          const dx = sx - mouse.x;
          const dy = sy - mouse.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < 26000) {
            const d = Math.sqrt(d2) || 1;
            const push = 1 - d / 161;
            sx += (dx / d) * push * 30;
            sy += (dy / d) * push * 30;
            boost = push;
          }

          if (Math.floor(t * 2 + g.flip) % 97 === 0) g.char = randomChar();

          const crest = yWave > 42; // wave crests sparkle accent
          const limeA = Math.min(baseA * 1.5 + boost * 0.5, 0.9);
          ctx.fillStyle =
            g.accent || crest || boost > 0.5
              ? `rgba(197, 255, 33, ${limeA})`
              : `rgba(150, 157, 163, ${baseA + boost * 0.35})`;
          ctx.fillText(g.char, sx, sy);
        }
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

    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.nx = (mouse.x / w - 0.5) * 2;
      mouse.ny = (mouse.y / h - 0.5) * 2;
    };
    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
      mouse.nx = 0;
      mouse.ny = 0;
    };
    if (finePointer && !reduced) {
      window.addEventListener("pointermove", onMove, { passive: true });
      window.addEventListener("pointerout", onLeave, { passive: true });
    }

    const io = new IntersectionObserver(([entry]) => {
      const visible = entry.isIntersecting && !document.hidden;
      if (visible && !running && !reduced) {
        running = true;
        lastT = performance.now() / 1000;
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
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerout", onLeave);
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
