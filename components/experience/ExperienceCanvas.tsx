"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBuilding, type BuildingSample } from "@/components/three/sampleBuilding";
import { sampleModel } from "./sampleModel";
import { siteContent } from "@/data/siteContent";
import { detectQuality, type QualityProfile } from "./quality";
import { experience } from "./state";
import { PHASES } from "./phases";
import MorphField, { BUILDING_PLANE_W } from "./MorphField";
import HoloBuilding from "./HoloBuilding";

// The single global WebGL surface. Fixed behind all content; the hero's
// scroll drives the sea → building → galaxy morph, the document scroll keeps
// the galaxy alive underneath every section. One canvas, one frame loop.

function Rig({ quality }: { quality: QualityProfile }) {
  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const p = experience.hero;
    const ease = p * p * (3 - 2 * p);
    // dolly in toward the building, drift back out for the galaxy
    const galaxyPull = THREE.MathUtils.smoothstep(p, PHASES.holdEnd, 1);
    const targetZ = THREE.MathUtils.lerp(8.6, 7.2, ease) + galaxyPull * 1.6;

    const calm = 1 - ease * 0.5;
    const px = quality.pointerEffects ? experience.pointerX : 0;
    const py = quality.pointerEffects ? experience.pointerY : 0;
    cam.position.z = THREE.MathUtils.damp(cam.position.z, targetZ, 2.5, delta);
    cam.position.x = THREE.MathUtils.damp(cam.position.x, px * 0.3 * calm, 2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, -py * 0.18 * calm, 2, delta);
    cam.lookAt(0, -0.3, 0);
  });
  return null;
}

export default function ExperienceCanvas({ onFail }: { onFail: () => void }) {
  const [quality] = useState<QualityProfile>(() => detectQuality());
  const [sample, setSample] = useState<BuildingSample | null>(null);
  const [paused, setPaused] = useState(false);
  const lastScrollY = useRef(0);

  // Offscreen building sampling — assets are data, never shown. Primary:
  // the true-3D GLB with per-sample normals + facade-texture luminance
  // (hologram lighting in the shader keeps it readable). Fallback: the
  // alpha-cutout photo with a luminance bas-relief.
  useEffect(() => {
    let cancelled = false;
    sampleModel(quality.buildingSamples, BUILDING_PLANE_W)
      .catch(() =>
        sampleBuilding(
          siteContent.hero.building.texture,
          quality.buildingSamples,
          BUILDING_PLANE_W,
          BUILDING_PLANE_W * (1350 / 3240)
        )
      )
      .then((s) => {
        if (!cancelled) setSample(s);
      })
      .catch(() => onFail());
    return () => {
      cancelled = true;
    };
  }, [quality, onFail]);

  // Single scroll + pointer driver for the whole experience.
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      experience.doc = max > 0 ? Math.min(y / max, 1) : 0;
      experience.scrollVel = experience.scrollVel * 0.9 + Math.abs(y - lastScrollY.current) * 0.1;
      lastScrollY.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    const fine = window.matchMedia("(pointer: fine)").matches;
    const onMove = (e: PointerEvent) => {
      experience.pointerX = (e.clientX / window.innerWidth) * 2 - 1;
      experience.pointerY = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    if (fine) window.addEventListener("pointermove", onMove, { passive: true });

    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (fine) window.removeEventListener("pointermove", onMove);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        dpr={[1, quality.maxDpr]}
        frameloop={paused ? "never" : "always"}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 50, position: [0, 0, 8.6], near: 0.1, far: 80 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            "webglcontextlost",
            (e) => {
              e.preventDefault();
              onFail();
            },
            { once: true }
          );
        }}
      >
        {sample && <MorphField sample={sample} quality={quality} />}
        {/* real holographic mesh — only when the GLB path sampled fine */}
        {sample?.normals && (
          <Suspense fallback={null}>
            <HoloBuilding planeW={BUILDING_PLANE_W} />
          </Suspense>
        )}
        <Rig quality={quality} />
      </Canvas>
    </div>
  );
}
