"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Mixes the real monochrome facade with a digital layer: grid, rim glow and a
// cell-based reveal. End state ≈ 65% photographic texture / 35% digital.
const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uProgress;
  uniform float uTime;
  varying vec2 vUv;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec4 tex = texture2D(uMap, vUv);
    float alpha = tex.a;
    float lum = dot(tex.rgb, vec3(0.299, 0.587, 0.114));

    vec3 lime = vec3(0.772, 1.0, 0.129);
    vec3 coolGray = vec3(0.55, 0.60, 0.66);

    // Digital layer: facade grid + silhouette rim.
    vec2 g = vUv * vec2(96.0, 40.0);
    float grid = max(
      smoothstep(0.93, 1.0, fract(g.x)),
      smoothstep(0.93, 1.0, fract(g.y))
    );
    float rim = clamp(fwidth(alpha) * 5.0, 0.0, 1.0);
    vec3 holo = lime * (grid * 0.30 + rim * 0.85) + coolGray * lum * 0.22;

    // Cell-based reveal of the real texture (selection-box aesthetic).
    float reveal = smoothstep(0.42, 0.80, uProgress);
    float n = hash(floor(vUv * vec2(72.0, 30.0)));
    float shown = step(n, reveal);

    // Light sweep across the facade as it materializes.
    float sweepPos = uProgress * 1.9 - 0.3;
    float sweep = smoothstep(0.22, 0.0, abs(vUv.x + vUv.y * 0.4 - sweepPos)) * 0.10 * reveal;

    vec3 real = vec3(lum) * 1.06;
    vec3 col = mix(holo, real, shown * 0.72);
    col += holo * 0.30 * (1.0 - shown * 0.55);
    col += vec3(sweep);

    // Early phase: outlines only, body fades in with progress.
    float body = smoothstep(0.16, 0.52, uProgress);
    float shape = clamp(rim * 0.95 + grid * 0.28, 0.0, 1.0);
    float appear = smoothstep(0.02, 0.12, uProgress);
    float outA = alpha * mix(shape, 1.0, body) * appear;

    gl_FragColor = vec4(col, outA);
  }
`;

interface Props {
  texture: THREE.Texture;
  progressRef: React.RefObject<number>;
  width: number;
  height: number;
}

export default function BuildingPlane({ texture, progressRef, width, height }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      uniforms: {
        uMap: { value: texture },
        uProgress: { value: 0 },
        uTime: { value: 0 },
      },
    });
  }, [texture]);

  useFrame((state, delta) => {
    const mat = matRef.current ?? material;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uProgress.value = THREE.MathUtils.damp(
      mat.uniforms.uProgress.value,
      progressRef.current ?? 0,
      6,
      delta
    );
  });

  return (
    <mesh material={material}>
      <planeGeometry args={[width, height]} />
    </mesh>
  );
}
