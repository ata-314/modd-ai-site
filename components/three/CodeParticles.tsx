"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingSample } from "./sampleBuilding";
import { createGlyphAtlas } from "./glyphAtlas";

const vertexShader = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aDelay;
  attribute float aSize;
  attribute float aGlyph;
  attribute float aAccent;
  attribute float aLum;
  uniform float uProgress;
  uniform float uTime;
  uniform vec3 uMouse;
  uniform float uPixelRatio;
  varying float vGlyph;
  varying float vAccent;
  varying float vAlpha;
  varying float vLum;

  float easeOutCubic(float t) { return 1.0 - pow(1.0 - t, 3.0); }

  void main() {
    float t = clamp((uProgress - aDelay) / 0.42, 0.0, 1.0);
    t = easeOutCubic(t);
    vec3 pos = mix(position, aTarget, t);

    float loose = 1.0 - t * 0.85;
    pos.x += sin(uTime * 0.6 + aDelay * 43.0) * 0.035 * loose;
    pos.y += cos(uTime * 0.5 + aDelay * 57.0) * 0.035 * loose;

    // Controlled cursor repulsion, fades as particles lock into the facade.
    vec2 toMouse = pos.xy - uMouse.xy;
    float d = length(toMouse);
    float repel = smoothstep(0.85, 0.0, d) * 0.22 * (0.35 + loose * 0.65);
    pos.xy += normalize(toMouse + 0.0001) * repel;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    gl_PointSize = aSize * uPixelRatio * (13.0 / -mv.z);

    vGlyph = aGlyph;
    vAccent = aAccent;
    vLum = aLum;
    // Faint glyph field is present even before scroll starts.
    float appear = 0.16 + 0.84 * smoothstep(0.0, 0.06, uProgress);
    float settle = mix(0.4, 0.95, t);
    float disperse = 1.0 - smoothstep(0.86, 1.0, uProgress) * 0.65;
    vAlpha = appear * settle * disperse;
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  varying float vGlyph;
  varying float vAccent;
  varying float vAlpha;
  varying float vLum;

  void main() {
    vec2 cell = vec2(mod(vGlyph, 4.0), floor(vGlyph / 4.0));
    vec2 uv = (cell + gl_PointCoord) / 4.0;
    float a = texture2D(uAtlas, uv).a;
    if (a * vAlpha < 0.02) discard;
    // Glyph brightness follows the facade pixel it represents — the
    // characters collectively render the building like ASCII art.
    vec3 shade = mix(vec3(0.22, 0.25, 0.28), vec3(0.88, 0.92, 0.95), vLum);
    vec3 lime = vec3(0.772, 1.0, 0.129);
    vec3 col = mix(shade, lime, vAccent);
    gl_FragColor = vec4(col, a * vAlpha);
  }
`;

interface Props {
  sample: BuildingSample;
  progressRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

export default function CodeParticles({ sample, progressRef, mouseRef }: Props) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(sample.starts, 3));
    geo.setAttribute("aTarget", new THREE.BufferAttribute(sample.targets, 3));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(sample.delays, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sample.sizes, 1));
    geo.setAttribute("aGlyph", new THREE.BufferAttribute(sample.glyphs, 1));
    geo.setAttribute("aAccent", new THREE.BufferAttribute(sample.accents, 1));
    geo.setAttribute("aLum", new THREE.BufferAttribute(sample.lums, 1));

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uProgress: { value: 0 },
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector3(99, 99, 0) },
        uPixelRatio: { value: 1 },
        uAtlas: { value: createGlyphAtlas() },
      },
    });
    return { geometry: geo, material: mat };
  }, [sample]);

  useFrame((state, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uPixelRatio.value = state.gl.getPixelRatio();
    mat.uniforms.uProgress.value = THREE.MathUtils.damp(
      mat.uniforms.uProgress.value,
      progressRef.current ?? 0,
      6,
      delta
    );
    const m = mouseRef.current;
    if (m) {
      const v = mat.uniforms.uMouse.value as THREE.Vector3;
      v.x = THREE.MathUtils.damp(v.x, m.x * 3.4, 4, delta);
      v.y = THREE.MathUtils.damp(v.y, m.y * 1.6, 4, delta);
    }
  });

  return <points geometry={geometry} material={material} ref={(p) => {
    if (p) matRef.current = p.material as THREE.ShaderMaterial;
  }} />;
}
