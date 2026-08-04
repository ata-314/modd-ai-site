"use client";

import { useEffect, useMemo, useRef } from "react";
import CodeSeaCanvas from "@/components/three/CodeSeaCanvas";
import { sampleBuilding } from "@/components/three/sampleBuilding";
import { siteContent } from "@/data/siteContent";
import { experience, markExperienceReady } from "./state";

const CHARS = "ｱｼﾂｶﾀﾈﾓﾃﾋｸﾘﾅﾒﾜ0123456789+=*#".split("");

// No-WebGL / reduced-motion fallback: the animated 2D code sea plus a
// building composed purely of glyphs, drawn once from the offscreen sample.
// The photo itself is never displayed.
export default function StaticCodeScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // CodeSeaCanvas expects a progress ref; bridge it to the shared state.
  const progressBridge = useMemo(
    () =>
      ({
        get current() {
          return experience.hero;
        },
      }) as React.RefObject<number>,
    []
  );

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) {
      markExperienceReady();
      return;
    }

    const draw = async () => {
      try {
        const w = (canvas.width = canvas.clientWidth);
        const h = (canvas.height = canvas.clientHeight);
        const planeW = 6.6;
        const sample = await sampleBuilding(
          siteContent.hero.building.texture,
          1300,
          planeW,
          planeW * (1350 / 3240)
        );
        if (cancelled) return;
        const scale = Math.min(w * 0.86, 920) / planeW;
        for (let i = 0; i < sample.count; i++) {
          const x = w / 2 + sample.targets[i * 3] * scale;
          const y = h * 0.52 - sample.targets[i * 3 + 1] * scale;
          const edge = sample.sizes[i] > 7;
          const lum = sample.lums[i];
          const size = Math.max(sample.sizes[i] * (scale / 95), 5);
          ctx.font = `${size.toFixed(1)}px ui-monospace, Menlo, monospace`;
          ctx.fillStyle =
            sample.accents[i] > 0
              ? "rgba(197, 255, 33, 0.5)"
              : `rgba(${Math.round(120 + lum * 120)}, ${Math.round(126 + lum * 120)}, ${Math.round(132 + lum * 118)}, ${edge ? 0.5 : 0.3})`;
          ctx.fillText(CHARS[i % CHARS.length], x, y);
        }
      } catch {
        // building stays absent; the sea alone is an acceptable floor
      } finally {
        if (!cancelled) markExperienceReady();
      }
    };
    draw();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <CodeSeaCanvas progressRef={progressBridge} />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-70" />
    </div>
  );
}
