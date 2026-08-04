"use client";

import { useEffect, useRef } from "react";

const CHARS =
  "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789";

// Classic Matrix digital rain — large falling katakana columns with fading
// trails. Used behind the boot loader; unmounts with it.
export default function MatrixRain({
  fontSize = 24,
  className = "",
}: {
  fontSize?: number;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    let raf = 0;
    let w = 0;
    let h = 0;
    let cols = 0;
    let drops: number[] = [];
    let speeds: number[] = [];
    const colW = fontSize * 0.95;

    const build = () => {
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(w / colW);
      drops = Array.from({ length: cols }, () => -Math.random() * (h / fontSize));
      speeds = Array.from({ length: cols }, () => 0.55 + Math.random() * 0.8);
      ctx.fillStyle = "rgba(3, 3, 3, 1)";
      ctx.fillRect(0, 0, w, h);
    };

    const randomChar = () => CHARS[Math.floor(Math.random() * CHARS.length)];

    let last = 0;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (now - last < 50) return; // ~20fps — the film's chunky cadence
      last = now;

      // Fading veil creates the trails.
      ctx.fillStyle = "rgba(3, 3, 3, 0.16)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = `${fontSize}px ui-monospace, Menlo, monospace`;
      ctx.textBaseline = "top";

      for (let i = 0; i < cols; i++) {
        const x = i * colW;
        const y = drops[i] * fontSize;
        if (y > -fontSize) {
          // Head glyph bright accent; one behind it dimmer for depth.
          ctx.fillStyle = "rgba(220, 255, 120, 0.95)";
          ctx.fillText(randomChar(), x, y);
          ctx.fillStyle = "rgba(197, 255, 33, 0.5)";
          ctx.fillText(randomChar(), x, y - fontSize);
        }
        drops[i] += speeds[i];
        if (y > h && Math.random() > 0.965) {
          drops[i] = -Math.random() * 6;
          speeds[i] = 0.55 + Math.random() * 0.8;
        }
      }
    };

    build();
    if (reduced) {
      // Single still frame: scattered dim glyphs, no animation.
      ctx.font = `${fontSize}px ui-monospace, Menlo, monospace`;
      for (let i = 0; i < cols * 6; i++) {
        ctx.fillStyle = `rgba(197, 255, 33, ${0.08 + Math.random() * 0.2})`;
        ctx.fillText(randomChar(), Math.random() * w, Math.random() * h);
      }
    } else {
      raf = requestAnimationFrame(step);
    }

    const onResize = () => build();
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [fontSize]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 h-full w-full ${className}`}
      aria-hidden="true"
    />
  );
}
