"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { experience } from "./state";
import { phaseWeights, BUILDING_BASE_YAW } from "./phases";

// The real building, rendered as a hologram: the actual GLB mesh with the
// real facade texture, tinted to the brand's green, fresnel rim glow on the
// silhouette, sweeping scanlines and a faint flicker. It materializes as
// the scroll enters the build phase, holds, then fades while the particle
// field dissolves into the galaxy. The glyph particles remain as a code
// aura wrapping the surface — but the architecture itself is unmistakable.

const MODEL_URL = "/models/building.glb";
const FACADE_URL = "/models/facade.jpg";
const DEPTH_SQUASH = 1; // real proportions — the model is never distorted

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vWorldY;
  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mv.xyz);
    vWorldY = (modelMatrix * vec4(position, 1.0)).y;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTime;
  uniform float uOp;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  varying vec2 vUv;
  varying float vWorldY;

  void main() {
    vec3 tex = texture2D(uMap, vUv).rgb;
    float lum = dot(tex, vec3(0.299, 0.587, 0.114));

    // real texture, gently cooled — signage must stay legible, so the
    // green wash is light and brightness is lifted
    vec3 tinted = tex * vec3(0.82, 1.0, 0.86);
    vec3 lime = vec3(0.772, 1.0, 0.129);

    // fresnel silhouette glow
    float fres = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 2.4);

    // sweeping scanlines + slow tall sweep + faint flicker — kept gentle so
    // the architecture and signage stay the star
    float scan = 0.94 + 0.06 * sin(vWorldY * 26.0 - uTime * 2.2);
    float sweep = smoothstep(0.25, 0.0, abs(fract(vWorldY * 0.08 - uTime * 0.05) - 0.5));
    float flicker = 0.98 + 0.02 * sin(uTime * 19.0 + vWorldY * 4.0);

    vec3 col = tinted * (0.85 + 0.6 * lum) * scan * flicker;
    col += lime * fres * 0.5;
    col += lime * sweep * 0.06;

    float alpha = uOp * (0.55 + 0.3 * fres + 0.35 * lum) * flicker;
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function HoloBuilding({ planeW }: { planeW: number }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const facade = useLoader(THREE.TextureLoader, FACADE_URL);
  const groupRef = useRef<THREE.Group>(null);
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const lineRef = useRef<THREE.LineBasicMaterial | null>(null);
  const pRef = useRef(0);

  const { geometry, material, edges, lineMat, scale, center, groundPos } = useMemo(() => {
    // clone so the hook-owned texture object is never mutated
    const tex = facade.clone();
    tex.flipY = false; // glTF UV convention
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;

    let found: THREE.BufferGeometry | null = null;
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!found && mesh.isMesh) found = mesh.geometry as THREE.BufferGeometry;
    });
    if (!found) throw new Error("model has no meshes");
    const g = found as THREE.BufferGeometry;
    if (!g.boundingBox) g.computeBoundingBox();
    const box = g.boundingBox!;
    const size = box.getSize(new THREE.Vector3());
    const c = box.getCenter(new THREE.Vector3());
    const s = planeW / Math.max(size.x, 1e-6);

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      side: THREE.FrontSide,
      uniforms: {
        uMap: { value: tex },
        uTime: { value: 0 },
        uOp: { value: 0 },
      },
    });

    // architectural line work — the hologram's wireframe skeleton
    const edges = new THREE.EdgesGeometry(g, 24);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0xc5ff21,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    return {
      geometry: g,
      material: mat,
      edges,
      lineMat,
      scale: s,
      center: c,
      // grounded on the code floor (world -2.75), slightly right — matches
      // the glyph field's uBOff exactly
      groundPos: [0.35, -2.75 + (size.y * s) / 2 + 0.02, 0] as [number, number, number],
    };
  }, [gltf, facade, planeW]);

  useEffect(() => {
    return () => {
      const mat = matRef.current;
      (mat?.uniforms.uMap.value as THREE.Texture)?.dispose();
      mat?.dispose();
      lineRef.current?.dispose();
    };
  }, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    const mat = matRef.current;
    if (!group || !mat) return;
    const p = THREE.MathUtils.damp(pRef.current, experience.hero, 5, delta);
    pRef.current = p;
    const w = phaseWeights(p);

    // materialize as the codes gather, stay while the headline + CTAs are
    // on stage, fade only deep into the galaxy dissolve
    const formIn = THREE.MathUtils.smoothstep(p, 0.26, 0.44);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(p, 0.66, 0.85);
    const op = formIn * fadeOut;

    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uOp.value = op;
    if (lineRef.current) lineRef.current.opacity = op * 0.2;
    group.visible = op > 0.01;
    // three-quarter pose shared with the glyph field; CCW dissolve
    group.rotation.y = BUILDING_BASE_YAW - w.spin * 0.55;
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.004;
    group.scale.set(scale * breathe, scale * breathe, scale * DEPTH_SQUASH * breathe);
  });

  return (
    <group ref={groupRef} position={groundPos} visible={false}>
      <mesh
        geometry={geometry}
        material={material}
        position={[-center.x, -center.y, -center.z]}
        ref={(m) => {
          if (m) matRef.current = m.material as THREE.ShaderMaterial;
        }}
      />
      <lineSegments
        geometry={edges}
        material={lineMat}
        position={[-center.x, -center.y, -center.z]}
        ref={(l) => {
          if (l) lineRef.current = l.material as THREE.LineBasicMaterial;
        }}
      />
    </group>
  );
}
