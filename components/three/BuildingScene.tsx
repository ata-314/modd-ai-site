"use client";

import { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import BuildingPlane from "./BuildingPlane";
import CodeParticles from "./CodeParticles";
import CameraRig from "./CameraRig";
import { sampleBuilding, type BuildingSample } from "./sampleBuilding";

const PLANE_W = 6.6;

interface Props {
  imageUrl: string;
  progressRef: React.RefObject<number>;
  onReady: () => void;
}

export default function BuildingScene({ imageUrl, progressRef, onReady }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [sample, setSample] = useState<BuildingSample | null>(null);
  const [inView, setInView] = useState(true);
  const readyRef = useRef(false);

  // Load texture + sample silhouette off the same image.
  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(imageUrl, (tex) => {
      if (cancelled) return;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.minFilter = THREE.LinearFilter;
      setTexture(tex);
    });
    const lowPower =
      typeof navigator !== "undefined" &&
      (navigator.hardwareConcurrency ?? 8) < 6;
    sampleBuilding(imageUrl, lowPower ? 3200 : 6500, PLANE_W, PLANE_W * (1350 / 3240))
      .then((s) => {
        if (!cancelled) setSample(s);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [imageUrl]);

  useEffect(() => {
    if (texture && sample && !readyRef.current) {
      readyRef.current = true;
      onReady();
    }
  }, [texture, sample, onReady]);

  // Pause rendering when the hero is off-screen.
  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Mouse tracking (desktop only — component itself is not rendered on touch).
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouseRef.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouseRef.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const planeH = PLANE_W * (1350 / 3240);

  return (
    <div ref={wrapperRef} className="absolute inset-0" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        frameloop={inView ? "always" : "never"}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
        camera={{ fov: 38, position: [0, 0, 7.3], near: 0.1, far: 30 }}
      >
        <group position={[0, -0.15, 0]}>
          {texture && (
            <BuildingPlane
              texture={texture}
              progressRef={progressRef}
              width={PLANE_W}
              height={planeH}
            />
          )}
          {sample && (
            <CodeParticles
              sample={sample}
              progressRef={progressRef}
              mouseRef={mouseRef}
            />
          )}
        </group>
        <CameraRig progressRef={progressRef} mouseRef={mouseRef} />
      </Canvas>
    </div>
  );
}
