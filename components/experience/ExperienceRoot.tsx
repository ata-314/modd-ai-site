"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { supportsWebGL } from "./quality";

const ExperienceCanvas = dynamic(() => import("./ExperienceCanvas"), { ssr: false });
const StaticCodeScene = dynamic(() => import("./StaticCodeScene"), { ssr: false });

// Decides once, on the client, which background experience runs:
// WebGL morph scene, or the lightweight code-only 2D composition
// (no WebGL / reduced motion / after an unrecoverable context loss).
export default function ExperienceRoot() {
  const [mode, setMode] = useState<"webgl" | "fallback" | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setMode(!reduced && supportsWebGL() ? "webgl" : "fallback");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  if (mode === "webgl") return <ExperienceCanvas onFail={() => setMode("fallback")} />;
  if (mode === "fallback") return <StaticCodeScene />;
  return null;
}
