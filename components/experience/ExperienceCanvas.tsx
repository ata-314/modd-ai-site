"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { sampleBuilding, type BuildingSample } from "@/components/three/sampleBuilding";
import { sampleModel } from "./sampleModel";
import { siteContent } from "@/data/siteContent";
import { detectQuality, type QualityProfile } from "./quality";
import { experience } from "./state";
import { PHASES } from "./phases";
import MorphField, { BUILDING_PLANE_W } from "./MorphField";

// The single global WebGL surface. Fixed behind all content; the hero's
// scroll drives the sea → building → galaxy morph, the document scroll keeps
// the galaxy alive underneath every section. One canvas, one frame loop.

// Cinematic camera. Sea/galaxy phases keep the wide centered framing; the
// building phase moves to a computed front-left three-quarter: camera near
// entrance level looking ~8° up, ~45-55mm feel (fov 38), distance derived
// from the model's real bounding dimensions so the building fills ~60% of
// the frame at any aspect ratio. Slow dolly-in while it holds, a ≤10° orbit
// through the dissolve, mouse parallax capped near ±1.5°.
function Rig({
  quality,
  dims,
}: {
  quality: QualityProfile;
  dims: { w: number; h: number; d: number } | null;
}) {
  const pRef = useRef(0);
  const lookRef = useRef(new THREE.Vector3(0, -0.3, 0));

  useFrame((state, delta) => {
    const cam = state.camera as THREE.PerspectiveCamera;
    const p = THREE.MathUtils.damp(pRef.current, experience.hero, 5, delta);
    pRef.current = p;

    const bw =
      THREE.MathUtils.smoothstep(p, 0.26, 0.5) *
      (1 - THREE.MathUtils.smoothstep(p, 0.72, 0.94));
    const galaxyPull = THREE.MathUtils.smoothstep(p, PHASES.holdEnd, 1);

    // wide framing (sea → galaxy)
    const az = 8.6 + galaxyPull * 1.6;

    // computed three-quarter framing (world coords; scene group at y -0.45)
    const h = dims?.h ?? 3.4;
    const wproj = dims ? dims.w * 0.93 + dims.d * 0.37 : 5.2;
    const FLOOR = -2.75;
    const bx = 0.35;
    const fovB = 38;
    const t = Math.tan((fovB * Math.PI) / 360);
    const fill = 0.62;
    // portrait: let the building fill ~92% of the width instead of pulling
    // the camera far back — never shrink it into meaninglessness on mobile
    const fillW = cam.aspect < 1 ? 0.92 : fill;
    let dist = Math.max(h / fill / (2 * t), wproj / (fillW * 2 * t * cam.aspect));
    dist *= 1 - 0.06 * THREE.MathUtils.smoothstep(p, 0.44, 0.62); // dolly-in
    const orbit = 0.18 * THREE.MathUtils.smoothstep(p, 0.5, 0.85); // ≤ ~10°
    const azm = -0.22 + orbit;

    const px = THREE.MathUtils.lerp(0, bx + Math.sin(azm) * dist, bw);
    const py = THREE.MathUtils.lerp(0, FLOOR + h * 0.22, bw);
    const pz = THREE.MathUtils.lerp(az, Math.cos(azm) * dist, bw);
    lookRef.current.set(
      THREE.MathUtils.lerp(0, bx, bw),
      THREE.MathUtils.lerp(-0.3, FLOOR + h * 0.58, bw),
      0
    );

    // mouse parallax — roughly ±1.5° at building distance
    const calm = 1 - bw * 0.35;
    const mx = quality.pointerEffects ? experience.pointerX * 0.25 * calm : 0;
    const my = quality.pointerEffects ? -experience.pointerY * 0.15 * calm : 0;

    cam.position.x = THREE.MathUtils.damp(cam.position.x, px + mx, 2.2, delta);
    cam.position.y = THREE.MathUtils.damp(cam.position.y, py + my, 2.2, delta);
    cam.position.z = THREE.MathUtils.damp(cam.position.z, pz, 2.2, delta);
    const fovTarget = THREE.MathUtils.lerp(50, fovB, bw);
    if (Math.abs(cam.fov - fovTarget) > 0.02) {
      cam.fov = THREE.MathUtils.damp(cam.fov, fovTarget, 3, delta);
      cam.updateProjectionMatrix();
    }
    cam.lookAt(lookRef.current);
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
      .catch((err) => {
        // never fall back silently — say which asset is missing/broken
        console.error(
          "[experience] 3D building model failed (/models/building.glb) — using 2D silhouette fallback:",
          err
        );
        return sampleBuilding(
          siteContent.hero.building.texture,
          quality.buildingSamples,
          BUILDING_PLANE_W,
          BUILDING_PLANE_W * (1350 / 3240)
        );
      })
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
        <Rig quality={quality} dims={sample?.dims ?? null} />
      </Canvas>
    </div>
  );
}
