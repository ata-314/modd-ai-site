"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingSample } from "@/components/three/sampleBuilding";
import { createGlyphAtlas, ATLAS_GRID, GLYPH_COUNT } from "@/components/three/glyphAtlas";
import { experience, markExperienceReady } from "./state";
import { PHASES, phaseWeights } from "./phases";
import type { QualityProfile } from "./quality";

// One particle system, three deterministic position sets. Every particle owns
// a sea slot, a building target and a galaxy slot; the vertex shader blends
// between them from a single scroll progress uniform. No per-frame attribute
// writes, no React state — geometry is built once, uniforms are mutated.

const BUILDING_PLANE_W = 7.4;

const vertexShader = /* glsl */ `
  attribute vec3 aSea;      // x: -1..1 slot, y: seed, z: depth offset
  attribute vec3 aStart;    // loose gather cloud around the building
  attribute vec3 aBuild;
  attribute vec3 aGalaxy;
  attribute vec3 aBrain;
  attribute float aDelay;   // 0..0.6 build stagger (roof + edges first)
  attribute float aSize;
  attribute float aGlyph;
  attribute float aEdge;
  attribute float aLum;
  attribute float aSeed;

  uniform float uTime;
  uniform float uSeaOff;
  uniform float uP;        // hero progress, damped
  uniform float uSpin;     // rigid building Y-rotation
  uniform float uDoc;      // document progress, damped
  uniform float uDim;
  uniform vec2 uMouse;     // world-space xy at z≈0
  uniform float uPR;

  varying float vGlyph;
  varying float vB;
  varying float vG;
  varying float vBr;
  varying float vCrest;
  varying float vLum;
  varying float vEdge;
  varying float vSeed;
  varying float vAlpha;
  varying float vDot;
  varying float vPulse;

  const float DEPTH = 46.0;

  void main() {
    // ---- Sea: cyberpunk code valley flowing toward the camera ----------
    // Ridged glyph mountain ranges flank a flat data-corridor down the
    // middle; the whole terrain streams toward the viewer and far peaks
    // fade into fog. Ridgelines glow accent.
    float zLin = mod(aSea.z - uSeaOff, DEPTH);
    float depthFrac = zLin / DEPTH;               // 0 near → 1 far
    vec3 sea;
    sea.z = 6.0 - zLin;
    sea.x = aSea.x * mix(8.0, 34.0, depthFrac);
    float ridge1 = 1.0 - abs(sin(sea.x * 0.16 + sea.z * 0.075));
    float ridge2 = 1.0 - abs(sin(sea.x * 0.055 - sea.z * 0.05 + 2.7));
    float detail = sin(sea.x * 0.6 + sea.z * 0.35 + aSea.y * 6.283) * 0.14;
    float corridor = smoothstep(1.2, 5.0, abs(sea.x));   // keep center open
    float h = (ridge1 * 1.3 + ridge2 * 2.2 + detail) * corridor
            * (0.75 + depthFrac * 0.9);
    // valley floor: shallow flowing data-swell
    h += sin(sea.x * 0.8 - uTime * 0.5) * 0.07
       + sin(sea.z * 0.5 - uTime * 0.75) * 0.11;
    sea.y = -2.3 + h;
    float crest = smoothstep(1.1, 2.4, h);        // ridgelines + peaks glow

    // ---- Building: gather, then lock ------------------------------------
    // Two stages: terrain codes first drift into a loose cloud around the
    // building (aStart), then lock onto the facade. Mixing straight from
    // the huge sea coordinates would smear the building even at 95%
    // formed, so the final lock happens from the nearby cloud only.
    float toGather = smoothstep(0.10, 0.32, uP);
    float t2 = clamp((uP - 0.28 - aDelay * 0.2) * 7.0, 0.0, 1.0);
    t2 = 1.0 - pow(1.0 - t2, 3.0);
    float dis = smoothstep(${PHASES.holdEnd.toFixed(3)} + aDelay * 0.10, ${PHASES.dissolveEnd.toFixed(3)}, uP);
    float wB = t2 * (1.0 - dis);
    float wG = smoothstep(${PHASES.holdEnd.toFixed(3)} + aDelay * 0.18, ${(PHASES.dissolveEnd + 0.05).toFixed(3)}, uP);
    vec3 gather = aStart;
    gather.x += sin(uTime * 0.5 + aSeed * 6.283) * 0.25;
    gather.y += cos(uTime * 0.45 + aSeed * 9.4) * 0.2;

    float ca = cos(uSpin);
    float sa = sin(uSpin);
    vec3 b = aBuild;
    b = vec3(b.x * ca + b.z * sa, b.y, -b.x * sa + b.z * ca);
    b.z += (aSeed - 0.5) * 0.25 * smoothstep(${PHASES.buildEnd.toFixed(3)}, ${PHASES.holdEnd.toFixed(3)}, uP);

    // ---- Galaxy: tilted spiral, breathing swirl, scroll drift ----------
    vec3 g = aGalaxy;
    float gr = length(g.xz);
    float ga = uTime * 0.05 + uDoc * 2.2 + (5.5 - gr) * 0.12
             + sin(uTime * 0.32 + gr * 1.7 + aSeed * 6.283) * 0.22;
    float gc = cos(ga);
    float gs = sin(ga);
    g.xz = vec2(g.x * gc - g.z * gs, g.x * gs + g.z * gc);
    g.y += sin(uTime * 0.24 + gr * 2.0 + aSeed * 12.0) * 0.24;
    g *= 1.0 + uDoc * 0.35 + sin(uTime * 0.2 + aSeed * 3.0) * 0.02;
    // tilt the disk toward the camera
    float tc = cos(-0.45);
    float ts = sin(-0.45);
    g.yz = vec2(g.y * tc - g.z * ts, g.y * ts + g.z * tc);
    // the whole form streams downward as the page scrolls — each particle
    // falls at its own rate, so the spiral pours rather than translates
    g.y -= uDoc * (1.6 + aSeed * 0.9);

    // ---- Brain: the galaxy condenses into a mind deep in the page ------
    float wBr = smoothstep(0.50, 0.78, uDoc) * wG;
    vec3 br = aBrain;
    float bra = uTime * 0.07 + uDoc * 1.2;
    float bc = cos(bra);
    float bs = sin(bra);
    br.xz = vec2(br.x * bc - br.z * bs, br.x * bs + br.z * bc);
    br *= 1.0 + 0.02 * sin(uTime * 1.1 + aSeed * 2.0);   // breathing
    br.y += sin(uTime * 0.5 + aSeed * 9.42) * 0.05;

    // ---- Blend ---------------------------------------------------------
    vec3 pos = mix(sea, gather, toGather);
    pos = mix(pos, b, wB);
    pos = mix(pos, g, wG);
    pos = mix(pos, br, wBr);

    // turbulence only while mid-morph, so each dissolve reads as physical
    float bell = max(wG * (1.0 - wG), wBr * (1.0 - wBr)) * 2.0;
    pos += vec3(
      sin(aSeed * 12.9 + uTime * 1.1),
      cos(aSeed * 7.7 + uTime * 1.4),
      sin(aSeed * 5.1 - uTime * 0.8)
    ) * bell * 0.45;

    // ---- Pointer: gentle parting + lift in a limited radius ------------
    vec2 tm = pos.xy - uMouse;
    float md = length(tm);
    float rep = smoothstep(1.35, 0.0, md) * 0.26 * (1.0 - wB * 0.6);
    pos.xy += normalize(tm + 1e-4) * rep;
    pos.y += rep * 0.35;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;
    // sea glyphs render much larger so the terrain reads at rest; the
    // building keeps tighter glyphs, the galaxy sits in between
    float formed = clamp(wB + wG + wBr, 0.0, 1.0);
    float sizeBoost = mix(1.7, 1.0, formed) + 0.3 * max(wG, wBr);
    gl_PointSize = aSize * sizeBoost * uPR * (12.5 / max(-mv.z, 0.5));

    // ---- Alpha ---------------------------------------------------------
    float fogA = 1.0 - depthFrac * 0.62;                       // depth fog
    float nearFade = smoothstep(6.0, 3.2, sea.z);
    float seaA = (0.55 + crest * 0.3) * fogA * max(nearFade, toGather);
    float a = mix(seaA, 0.5, toGather * 0.85);
    a = mix(a, 0.85, wB);
    a = mix(a, 0.55, wG);
    a = mix(a, 0.62, wBr);
    a += smoothstep(1.35, 0.0, md) * 0.25;                     // pointer glow
    vAlpha = a * uDim;

    vGlyph = aGlyph;
    vB = wB;
    vG = wG;
    vBr = wBr;
    vCrest = crest;
    vLum = aLum;
    vEdge = aEdge;
    vSeed = aSeed;
    vPulse = 0.6 + 0.4 * sin(uTime * 2.2 + aSeed * 25.0);
    // sea + building stay pure Matrix glyphs; a few bare energy points
    // appear only once the galaxy / brain forms take over
    vDot = step(0.93, aSeed) * smoothstep(0.25, 0.6, max(wG, wBr));
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  varying float vGlyph;
  varying float vB;
  varying float vG;
  varying float vBr;
  varying float vCrest;
  varying float vLum;
  varying float vEdge;
  varying float vSeed;
  varying float vAlpha;
  varying float vDot;
  varying float vPulse;

  const float GRID = ${ATLAS_GRID.toFixed(1)};

  void main() {
    float shape;
    if (vDot > 0.5) {
      // bare energy particle — soft round point
      float d = length(gl_PointCoord - 0.5);
      shape = smoothstep(0.5, 0.12, d);
    } else {
      vec2 cell = vec2(mod(vGlyph, GRID), floor(vGlyph / GRID));
      shape = texture2D(uAtlas, (cell + gl_PointCoord) / GRID).a;
    }
    if (shape * vAlpha < 0.02) discard;

    vec3 lime = vec3(0.772, 1.0, 0.129);

    // sea: cool teal-gray, ridgelines + scattered neon spark accent
    vec3 seaCol = mix(vec3(0.40, 0.52, 0.47), lime, max(vCrest * 0.9, step(vSeed, 0.07)));
    // building: luminance-shaded facade; accent only on selected edges
    vec3 shade = mix(vec3(0.16, 0.18, 0.20), vec3(0.85, 0.90, 0.93), vLum);
    float bAccent = vEdge * step(vSeed, 0.12);
    vec3 buildCol = mix(shade * mix(1.0, 1.25, vEdge), lime, bAccent);
    // galaxy: cool starlight with sparse accent
    vec3 galCol = mix(vec3(0.72, 0.76, 0.82), lime, step(vSeed, 0.06));
    // brain: soft mind-gray, synapses pulse accent
    vec3 brCol = mix(vec3(0.80, 0.82, 0.87), lime * vPulse, step(vSeed, 0.09));

    vec3 col = mix(seaCol, buildCol, vB);
    col = mix(col, galCol, vG);
    col = mix(col, brCol, vBr);

    gl_FragColor = vec4(col, shape * vAlpha);
  }
`;

// Deterministic pseudo-random from an integer index.
function hash(i: number): number {
  let t = (i + 1) * 0x6d2b79f5;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

interface Props {
  sample: BuildingSample;
  quality: QualityProfile;
}

export default function MorphField({ sample, quality }: Props) {
  const matRef = useRef<THREE.ShaderMaterial | null>(null);
  const seaOffRef = useRef(0);
  const readyRef = useRef(false);

  const { geometry, material } = useMemo(() => {
    const n = quality.particleCount;
    const seas = new Float32Array(n * 3);
    const startsArr = new Float32Array(n * 3);
    const builds = new Float32Array(n * 3);
    const galaxies = new Float32Array(n * 3);
    const brains = new Float32Array(n * 3);
    const delays = new Float32Array(n);
    const sizes = new Float32Array(n);
    const glyphs = new Float32Array(n);
    const edges = new Float32Array(n);
    const lums = new Float32Array(n);
    const seeds = new Float32Array(n);

    for (let i = 0; i < n; i++) {
      const r1 = hash(i);
      const r2 = hash(i + 100000);
      const r3 = hash(i + 200000);

      // sea slot: normalized x, seed, depth offset
      seas[i * 3] = (r1 - 0.5) * 2;
      seas[i * 3 + 1] = r2;
      seas[i * 3 + 2] = r3 * 46;

      // building target — cycle through the sample if counts differ
      const s = i % sample.count;
      builds[i * 3] = sample.targets[s * 3];
      builds[i * 3 + 1] = sample.targets[s * 3 + 1];
      builds[i * 3 + 2] = sample.targets[s * 3 + 2];
      startsArr[i * 3] = sample.starts[s * 3];
      startsArr[i * 3 + 1] = sample.starts[s * 3 + 1];
      startsArr[i * 3 + 2] = sample.starts[s * 3 + 2];
      delays[i] = sample.delays[s];
      edges[i] = sample.accents[s] > 0 || sample.sizes[s] > 7 ? 1 : 0;
      lums[i] = sample.lums[s];
      sizes[i] = sample.sizes[s] * 0.9;

      // galaxy slot: 3-arm spiral with center bulge, deterministic
      const u = hash(i + 300000);
      const rad = 5.4 * Math.pow(u, 0.62);
      const arm = i % 3;
      const angle =
        (rad / 5.4) * 4.6 +
        arm * ((Math.PI * 2) / 3) +
        (hash(i + 400000) - 0.5) * 0.55;
      const thickness = (hash(i + 500000) - 0.5) * (1.1 - rad / 7);
      galaxies[i * 3] = Math.cos(angle) * rad;
      galaxies[i * 3 + 1] = thickness * 0.9;
      galaxies[i * 3 + 2] = Math.sin(angle) * rad;

      glyphs[i] = Math.floor(hash(i + 600000) * GLYPH_COUNT);
      seeds[i] = hash(i + 700000);

      // brain slot: two wrinkled hemispheres on a deformed sphere
      const bu = hash(i + 800000);
      const bv = hash(i + 900000);
      const theta = bu * Math.PI * 2;
      const phi = Math.acos(2 * bv - 1);
      let bx = Math.sin(phi) * Math.cos(theta);
      let by = Math.cos(phi);
      let bz = Math.sin(phi) * Math.sin(theta);
      // cortical folds — layered high-frequency ripples on the radius
      const wrinkle =
        Math.sin(bx * 6.2 + bz * 4.1 + by * 3.0) *
        Math.sin(bz * 7.3 - bx * 5.2 + by * 2.1);
      let rr = 1 + wrinkle * 0.07;
      // longitudinal fissure between the hemispheres, deepest on top
      const fissure =
        Math.max(0, 1 - Math.abs(bx) / 0.14) * Math.max(0, by + 0.15);
      rr -= fissure * 0.18;
      bx *= 0.82 * rr;
      by *= 0.74 * rr;
      bz *= 1.06 * rr;
      bx += Math.sign(bx) * 0.045; // hemisphere separation
      if (by < -0.4) by = -0.4 + (by + 0.4) * 0.45; // flattened base
      const BRAIN_SCALE = 2.7;
      brains[i * 3] = bx * BRAIN_SCALE;
      brains[i * 3 + 1] = by * BRAIN_SCALE + 0.3;
      brains[i * 3 + 2] = bz * BRAIN_SCALE;
    }

    const geo = new THREE.BufferGeometry();
    // `position` is required by three but unused — sea is derived in-shader.
    geo.setAttribute("position", new THREE.BufferAttribute(seas, 3));
    geo.setAttribute("aSea", new THREE.BufferAttribute(seas, 3));
    geo.setAttribute("aStart", new THREE.BufferAttribute(startsArr, 3));
    geo.setAttribute("aBuild", new THREE.BufferAttribute(builds, 3));
    geo.setAttribute("aGalaxy", new THREE.BufferAttribute(galaxies, 3));
    geo.setAttribute("aBrain", new THREE.BufferAttribute(brains, 3));
    geo.setAttribute("aDelay", new THREE.BufferAttribute(delays, 1));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aGlyph", new THREE.BufferAttribute(glyphs, 1));
    geo.setAttribute("aEdge", new THREE.BufferAttribute(edges, 1));
    geo.setAttribute("aLum", new THREE.BufferAttribute(lums, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -10), 60);

    const mat = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uTime: { value: 0 },
        uSeaOff: { value: 0 },
        uP: { value: 0 },
        uSpin: { value: 0 },
        uDoc: { value: 0 },
        uDim: { value: 1 },
        uMouse: { value: new THREE.Vector2(99, 99) },
        uPR: { value: 1 },
        uAtlas: { value: createGlyphAtlas() },
      },
    });
    return { geometry: geo, material: mat };
  }, [sample, quality]);

  useEffect(() => {
    return () => {
      geometry.dispose();
      (material.uniforms.uAtlas.value as THREE.Texture)?.dispose();
      material.dispose();
    };
  }, [geometry, material]);

  useFrame((state, delta) => {
    const mat = matRef.current;
    if (!mat) return;
    const u = mat.uniforms;

    u.uTime.value = state.clock.elapsedTime;
    u.uPR.value = state.gl.getPixelRatio();

    // Damped scroll progress → weights → flow speed (eased, never zero).
    const p = THREE.MathUtils.damp(u.uP.value, experience.hero, 5, delta);
    u.uP.value = p;
    const w = phaseWeights(p);
    seaOffRef.current += w.flow * 6.2 * delta;
    u.uSeaOff.value = seaOffRef.current;
    u.uSpin.value = w.spin;
    u.uDoc.value = THREE.MathUtils.damp(u.uDoc.value, experience.doc, 4, delta);
    // Dim the field under readable content once the galaxy takes over.
    const dimTarget = 1 - 0.5 * THREE.MathUtils.smoothstep(p, 0.85, 1);
    u.uDim.value = THREE.MathUtils.damp(u.uDim.value, dimTarget, 4, delta);

    // Pointer in world units on the z≈0 plane.
    if (quality.pointerEffects) {
      const cam = state.camera as THREE.PerspectiveCamera;
      const halfH = Math.tan((cam.fov * Math.PI) / 360) * cam.position.z;
      const halfW = halfH * cam.aspect;
      const m = u.uMouse.value as THREE.Vector2;
      m.x = THREE.MathUtils.damp(m.x, experience.pointerX * halfW, 4, delta);
      m.y = THREE.MathUtils.damp(m.y, experience.pointerY * halfH, 4, delta);
    }

    if (!readyRef.current) {
      readyRef.current = true;
      markExperienceReady();
    }
  });

  return (
    <points
      geometry={geometry}
      material={material}
      position={[0, -0.45, 0]}
      ref={(pts) => {
        if (pts) matRef.current = pts.material as THREE.ShaderMaterial;
      }}
    />
  );
}

export { BUILDING_PLANE_W };
