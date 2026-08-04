"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// Procedural 3D cursor for fine pointers: a translucent glass icosahedron
// core inside a thin acid-metal torus, lit by an environment map. Rendered
// on a tiny dedicated 96×96 canvas (low DPR) — not a second full-screen
// WebGL surface. The wrapper div follows the pointer with damped physics;
// the object banks toward its direction of travel and idles with a slow,
// premium rotation. Reduced motion gets a static CSS ring instead.

const SIZE = 96;
const INTERACTIVE =
  "a, button, [role='button'], input, textarea, select, label, [data-cursor]";

export default function Cursor3D() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mode, setMode] = useState<"off" | "webgl" | "static">("off");

  // Shared interaction state between the follow loop and the render loop.
  const stateRef = useRef({ hover: false, down: false, velX: 0, velY: 0 });

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      if (!window.matchMedia("(pointer: fine)").matches) return;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      setMode(reduced ? "static" : "webgl");
    });
    return () => cancelAnimationFrame(id);
  }, []);

  // Pointer follow + interaction state — shared by both modes.
  useEffect(() => {
    if (mode === "off") return;
    const wrap = wrapRef.current;
    const dot = dotRef.current;
    if (!wrap || !dot) return;
    const state = stateRef.current;

    document.documentElement.classList.add("custom-cursor");

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    const vel = { x: 0, y: 0 };
    let raf = 0;
    state.hover = false;
    state.down = false;
    let visible = false;

    const onMove = (e: PointerEvent) => {
      target.x = e.clientX;
      target.y = e.clientY;
      visible = true;
      state.hover = !!(e.target as Element | null)?.closest?.(INTERACTIVE);
    };
    const onDown = () => {
      state.down = true;
    };
    const onUp = () => {
      state.down = false;
    };
    const onLeave = () => {
      visible = false;
    };

    const loop = () => {
      const dx = target.x - pos.x;
      const dy = target.y - pos.y;
      pos.x += dx * 0.16;
      pos.y += dy * 0.16;
      vel.x = vel.x * 0.84 + dx * 0.16;
      vel.y = vel.y * 0.84 + dy * 0.16;
      state.velX = vel.x;
      state.velY = vel.y;

      wrap.style.transform = `translate3d(${pos.x - SIZE / 2}px, ${pos.y - SIZE / 2}px, 0)`;
      dot.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) translate(-50%, -50%) scale(${state.down ? 1.5 : 1})`;
      wrap.style.opacity = visible ? "1" : "0";
      dot.style.opacity = visible ? "1" : "0";
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
  }, [mode]);

  // The tiny WebGL scene.
  useEffect(() => {
    if (mode !== "webgl") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const state = stateRef.current;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch {
      setTimeout(() => setMode("static"), 0);
      return;
    }
    renderer.setSize(SIZE, SIZE, false);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 10);
    camera.position.z = 3.4;

    const pmrem = new THREE.PMREMGenerator(renderer);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;

    const group = new THREE.Group();
    scene.add(group);

    // Glass core
    const coreGeo = new THREE.IcosahedronGeometry(0.58, 2);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0xf4f3ee,
      metalness: 0,
      roughness: 0.08,
      transmission: 0.92,
      thickness: 0.7,
      ior: 1.4,
      clearcoat: 1,
      clearcoatRoughness: 0.15,
      transparent: true,
      opacity: 0.92,
      envMapIntensity: 1.1,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Acid-metal torus
    const torusGeo = new THREE.TorusGeometry(0.94, 0.045, 20, 56);
    const torusMat = new THREE.MeshStandardMaterial({
      color: 0xc5ff21,
      metalness: 0.85,
      roughness: 0.28,
      emissive: 0xc5ff21,
      emissiveIntensity: 0.18,
      envMapIntensity: 0.9,
    });
    const torus = new THREE.Mesh(torusGeo, torusMat);
    torus.rotation.x = Math.PI / 2.6;
    group.add(torus);

    // Faint inner glow
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = glowCanvas.height = 64;
    const gctx = glowCanvas.getContext("2d")!;
    const grad = gctx.createRadialGradient(32, 32, 2, 32, 32, 30);
    grad.addColorStop(0, "rgba(197,255,33,0.55)");
    grad.addColorStop(1, "rgba(197,255,33,0)");
    gctx.fillStyle = grad;
    gctx.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(glowCanvas);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTex,
        transparent: true,
        opacity: 0.35,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.scale.setScalar(1.1);
    group.add(glow);

    scene.add(new THREE.AmbientLight(0xffffff, 0.35));
    const key = new THREE.DirectionalLight(0xffffff, 1.1);
    key.position.set(2, 3, 4);
    scene.add(key);

    const clamp = (v: number, lim: number) => Math.max(-lim, Math.min(lim, v));
    const spring = { core: 1, torus: 1 };
    let raf = 0;
    let lost = false;
    const clock = new THREE.Clock();

    const render = () => {
      if (lost) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      // slow premium idle + banking toward travel direction
      group.rotation.y = t * 0.35 + clamp(state.velX * 0.012, 0.55);
      group.rotation.x = t * 0.12 + clamp(-state.velY * 0.012, 0.55);
      torus.rotation.z = t * 0.5;

      // spring/damped interaction scales
      const coreTarget = state.down ? 1.45 : 1;
      const torusTarget = state.down ? 0.9 : state.hover ? 1.42 : 1;
      spring.core += (coreTarget - spring.core) * Math.min(dt * 14, 1);
      spring.torus += (torusTarget - spring.torus) * Math.min(dt * 10, 1);
      core.scale.setScalar(spring.core);
      torus.scale.setScalar(spring.torus);
      glow.material.opacity = 0.3 + (state.down ? 0.25 : 0) + (state.hover ? 0.1 : 0);

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);

    const onLost = (e: Event) => {
      e.preventDefault();
      lost = true;
      setMode("static");
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(raf);
      } else if (!lost) {
        clock.getDelta();
        raf = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      lost = true;
      cancelAnimationFrame(raf);
      canvas.removeEventListener("webglcontextlost", onLost);
      document.removeEventListener("visibilitychange", onVisibility);
      coreGeo.dispose();
      coreMat.dispose();
      torusGeo.dispose();
      torusMat.dispose();
      glowTex.dispose();
      glow.material.dispose();
      env.dispose();
      pmrem.dispose();
      renderer.dispose();
    };
  }, [mode]);

  if (mode === "off") return null;

  return (
    <div className="cursor3d-root" aria-hidden="true">
      <div ref={wrapRef} className="cursor3d-wrap" style={{ width: SIZE, height: SIZE }}>
        {mode === "webgl" ? (
          <canvas ref={canvasRef} width={SIZE} height={SIZE} className="h-full w-full" />
        ) : (
          <div className="cursor3d-static" />
        )}
      </div>
      <div ref={dotRef} className="cursor3d-dot" />
    </div>
  );
}
