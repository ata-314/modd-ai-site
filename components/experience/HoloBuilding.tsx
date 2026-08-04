"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useLoader } from "@react-three/fiber";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { experience } from "./state";
import { PHASES, phaseWeights } from "./phases";

// The real building, rendered as a hologram: the actual GLB mesh with the
// real facade texture, tinted to the brand's green, fresnel rim glow on the
// silhouette, sweeping scanlines and a faint flicker. It materializes as
// the scroll enters the build phase, holds, then fades while the particle
// field dissolves into the galaxy. The glyph particles remain as a code
// aura wrapping the surface — but the architecture itself is unmistakable.

const MODEL_URL = "/models/building.glb";
const FACADE_URL = "/models/facade.jpg";
const DEPTH_SQUASH = 0.5; // must match sampleModel's target compression

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

    // real texture, pulled toward the hologram's cold green
    vec3 tinted = tex * vec3(0.62, 0.98, 0.70);
    vec3 lime = vec3(0.772, 1.0, 0.129);

    // fresnel silhouette glow
    float fres = pow(1.0 - clamp(dot(vNormal, vViewDir), 0.0, 1.0), 2.4);

    // sweeping scanlines + slow tall sweep + faint flicker
    float scan = 0.82 + 0.18 * sin(vWorldY * 26.0 - uTime * 2.2);
    float sweep = smoothstep(0.25, 0.0, abs(fract(vWorldY * 0.08 - uTime * 0.05) - 0.5));
    float flicker = 0.96 + 0.04 * sin(uTime * 19.0 + vWorldY * 4.0);

    vec3 col = tinted * (0.55 + 0.45 * lum) * scan * flicker;
    col += lime * fres * 0.9;
    col += lime * sweep * 0.10;

    float alpha = uOp * (0.34 + 0.5 * fres + 0.22 * lum) * flicker;
    gl_FragColor = vec4(col, alpha);
  }
`;

export default function HoloBuilding({ planeW }: { planeW: number }) {
  const gltf = useLoader(GLTFLoader, MODEL_URL);
  const facade = useLoader(THREE.TextureLoader, FACADE_URL);
  const groupRef = useRef<THREE.Group>(null);
  const pRef = useRef(0);

  const { geometry, material, scale, center } = useMemo(() => {
    facade.flipY = false; // glTF UV convention
    facade.colorSpace = THREE.SRGBColorSpace;
    facade.needsUpdate = true;

    let geo: THREE.BufferGeometry | null = null;
    gltf.scene.updateMatrixWorld(true);
    gltf.scene.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!geo && mesh.isMesh) geo = mesh.geometry as THREE.BufferGeometry;
    });
    if (!geo) throw new Error("model has no meshes");
    const g = geo as THREE.BufferGeometry;
    g.computeBoundingBox();
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
        uMap: { value: facade },
        uTime: { value: 0 },
        uOp: { value: 0 },
      },
    });
    return { geometry: g, material: mat, scale: s, center: c };
  }, [gltf, facade, planeW]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const p = THREE.MathUtils.damp(pRef.current, experience.hero, 5, delta);
    pRef.current = p;
    const w = phaseWeights(p);

    // materialize during the build phase, fade out through the dissolve
    const formIn = THREE.MathUtils.smoothstep(p, 0.3, 0.5);
    const fadeOut = 1 - THREE.MathUtils.smoothstep(p, PHASES.holdEnd, PHASES.dissolveEnd - 0.02);
    const op = formIn * fadeOut;

    material.uniforms.uTime.value = state.clock.elapsedTime;
    material.uniforms.uOp.value = op;
    group.visible = op > 0.01;
    group.rotation.y = w.spin;
    const breathe = 1 + Math.sin(state.clock.elapsedTime * 0.6) * 0.004;
    group.scale.set(scale * breathe, scale * breathe, scale * DEPTH_SQUASH * breathe);
  });

  return (
    <group ref={groupRef} position={[0, -0.45, 0]} visible={false}>
      <mesh
        geometry={geometry}
        material={material}
        position={[-center.x, -center.y, -center.z]}
      />
    </group>
  );
}
