"use client";

import { useEffect, useRef, useState } from "react";

// Minimal futuristic cursor (fine pointers only): an instant accent dot and
// a hairline ring that trails with damped physics. A single thin accent arc
// sweeps the ring slowly — the only ornament. Ring grows over interactive
// elements, compresses on press. Pure CSS/DOM; styles in globals.css.

const INTERACTIVE =
  "a, button, [role='button'], input, textarea, select, label, [data-cursor]";

export default function Cursor() {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (window.matchMedia("(pointer: fine)").matches) setActive(true);
    });
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    if (!active) return;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    document.documentElement.classList.add("custom-cursor");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let hover = false;
    let down = false;
    let visible = false;
    let scale = 1;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      visible = true;
      hover = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
    };
    const onDown = () => {
      down = true;
    };
    const onUp = () => {
      down = false;
    };
    const onLeave = () => {
      visible = false;
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.16;
      pos.y += (target.y - pos.y) * 0.16;
      const targetScale = down ? 0.72 : hover ? 1.55 : 1;
      scale += (targetScale - scale) * 0.18;

      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${down ? 1.6 : 1})`;
      ring.style.opacity = visible ? "1" : "0";
      dot.style.opacity = visible ? "1" : "0";
      ring.classList.toggle("cursor-hover", hover);
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, [active]);

  if (!active) return null;

  return (
    <div className="cursor-root" aria-hidden="true">
      <div ref={ringRef} className="cursor-ring">
        <span className="cursor-arc" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
