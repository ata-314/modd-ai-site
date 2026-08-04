"use client";

import { useEffect, useRef } from "react";

// Futuristic custom cursor (fine pointers only): a spinning accent ring with
// HUD corner brackets that tilts in 3D toward its direction of travel, plus
// a snappy center dot. Grows over links/buttons, compresses on press.
// Styles live in globals.css under `.cursor-*`.
export default function Cursor() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const wrap = wrapRef.current;
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!wrap || !ring || !dot) return;

    document.documentElement.classList.add("custom-cursor");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let vx = 0;
    let vy = 0;
    let hover = false;
    let down = false;
    let visible = false;
    let raf = 0;

    const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      visible = true;
      hover = !!(e.target as Element | null)?.closest?.(
        "a, button, [role='button'], input, textarea, select, label, [data-cursor]"
      );
    };
    const onDown = () => {
      down = true;
    };
    const onUp = () => {
      down = false;
    };
    const onLeaveWindow = () => {
      visible = false;
    };

    const loop = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * 0.18;
      pos.y += dy * 0.18;
      vx = vx * 0.82 + dx * 0.18;
      vy = vy * 0.82 + dy * 0.18;

      // Ring banks toward its travel direction — the 3D feel.
      const rotY = clamp(vx * 0.55, 32);
      const rotX = clamp(-vy * 0.55, 32);
      const scale = down ? 0.8 : hover ? 1.7 : 1;

      ring.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) perspective(340px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(${scale})`;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${down ? 1.6 : 1})`;
      wrap.style.opacity = visible ? "1" : "0";
      wrap.classList.toggle("cursor-hover", hover);
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", onUp, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeaveWindow);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      document.documentElement.removeEventListener("mouseleave", onLeaveWindow);
      document.documentElement.classList.remove("custom-cursor");
    };
  }, []);

  return (
    <div ref={wrapRef} className="cursor-wrap" aria-hidden="true">
      <div ref={ringRef} className="cursor-ring">
        <span className="cursor-ring-spin" />
        <span className="cursor-corners" />
      </div>
      <div ref={dotRef} className="cursor-dot" />
    </div>
  );
}
