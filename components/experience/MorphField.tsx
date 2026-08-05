"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { BuildingSample } from "@/components/three/sampleBuilding";
import { createGlyphAtlas, ATLAS_GRID, GLYPH_COUNT } from "@/components/three/glyphAtlas";
import { experience, markExperienceReady } from "./state";
import { PHASES, phaseWeights, BUILDING_BASE_YAW } from "./phases";
import type { QualityProfile } from "./quality";

// One particle system, three deterministic position sets. Every particle owns
// a sea slot, a building target and a galaxy slot; the vertex shader blends
// between them from a single scroll progress uniform. No per-frame attribute
// writes, no React state — geometry is built once, uniforms are mutated.

const BUILDING_PLANE_W = 4.8;

const vertexShader = /* glsl */ `
  attribute vec3 aSea;      // x: -1..1 slot, y: seed, z: depth offset
  attribute vec3 aStart;    // loose gather cloud around the building
  attribute vec3 aBuild;
  attribute vec3 aNormal;   // building surface normal — hologram lighting
  attribute float aLayer;   // 0 = architectural edge, 1 = surface, 2 = interior
  attribute vec3 aBrain;
  attribute vec3 aBrain2;  // firing partner — signals travel between the two
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
  uniform vec3 uBOff;      // building world offset (grounded, slightly right)
  uniform float uBH;       // building height — formation scan + interior drift
  uniform float uSizeMul;  // portrait screens render larger glyphs

  varying float vGlyph;
  varying float vB;
  varying float vSig;
  varying float vNode;
  varying float vBr;
  varying float vCrest;
  varying float vLum;
  varying float vEdge;
  varying float vSeed;
  varying float vAlpha;
  varying float vDot;
  varying float vPulse;
  varying float vLit;
  varying float vRim;
  varying float vScan;
  varying float vLayer;
  varying float vWave;

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
    // at the horizon the ranges close across the whole width — a distant
    // half-holographic mountain chain behind the valley
    float horizonRange = smoothstep(0.55, 0.9, depthFrac);
    float relief = max(corridor, horizonRange);
    float h = (ridge1 * 1.3 + ridge2 * 2.2 + detail) * relief
            * (0.75 + depthFrac * 0.9);
    // valley floor: shallow flowing data-swell
    h += sin(sea.x * 0.8 - uTime * 0.5) * 0.07
       + sin(sea.z * 0.5 - uTime * 0.75) * 0.11;
    sea.y = -2.3 + h;
    float crest = smoothstep(1.1, 2.4, h);        // ridgelines + peaks glow
    // far peaks punch through the fog as a glowing hologram skyline
    float skyline = horizonRange * crest;
    // soft holographic light pooling on the floor beneath the building
    float underGlow = exp(-pow((sea.x - uBOff.x) * 0.55, 2.0))
                    * exp(-pow(sea.z * 0.35, 2.0))
                    * smoothstep(0.3, 0.5, uP) * (1.0 - smoothstep(0.66, 0.85, uP));

    // ---- Building: gather, then lock ------------------------------------
    // Two stages: terrain codes first drift into a loose cloud around the
    // building (aStart), then lock onto the facade. Mixing straight from
    // the huge sea coordinates would smear the building even at 95%
    // formed, so the final lock happens from the nearby cloud only.
    // ~30% of the field never morphs: a permanent code sea keeps flowing
    // behind the building and behind every section below the hero
    float mor = 1.0 - step(aSea.y, 0.30);
    float toGather = smoothstep(0.10, 0.32, uP) * mor;
    float t2 = clamp((uP - 0.28 - aDelay * 0.2) * 7.0, 0.0, 1.0);
    t2 = 1.0 - pow(1.0 - t2, 3.0);
    float dis = smoothstep(${PHASES.holdEnd.toFixed(3)} + aDelay * 0.10, ${PHASES.dissolveEnd.toFixed(3)}, uP);
    float wB = t2 * (1.0 - dis) * mor;
    float wG = smoothstep(${PHASES.holdEnd.toFixed(3)} + aDelay * 0.18, ${(PHASES.dissolveEnd + 0.05).toFixed(3)}, uP) * mor;
    vec3 gather = aStart;
    gather.x += sin(uTime * 0.5 + aSeed * 6.283) * 0.25;
    gather.y += cos(uTime * 0.45 + aSeed * 9.4) * 0.2;

    float ca = cos(uSpin);
    float sa = sin(uSpin);
    vec3 bl = aBuild;
    bl = vec3(bl.x * ca + bl.z * sa, bl.y, -bl.x * sa + bl.z * ca);

    float isEdge = 1.0 - step(0.5, aLayer);
    float isInt = step(1.5, aLayer);
    float isSurf = 1.0 - isEdge - isInt;

    // interior depth particles rise slowly inside the volume
    bl.y += isInt * (mod(uTime * (0.10 + aSeed * 0.14) + aSeed * 7.0, uBH) - uBH * 0.5) * 0.5;
    // living surface: faint vertical current + micro shimmer (never melting)
    bl.y += isSurf * sin(uTime * 0.7 + aSeed * 40.0) * 0.015;

    // Hologram lighting: readability comes from light — camera-facing
    // surfaces carry the texture, rear surfaces sink into the dark,
    // silhouette edges rim-glow.
    vec3 bn = vec3(aNormal.x * ca + aNormal.z * sa, aNormal.y, -aNormal.x * sa + aNormal.z * ca);
    float facing = bn.z;
    float depthShade = smoothstep(-2.0, 1.6, bl.z);
    vLit = (0.30 + 0.70 * clamp(facing, 0.0, 1.0)) * (0.35 + 0.65 * depthShade);
    vRim = smoothstep(0.60, 0.95, 1.0 - abs(facing)) * depthShade * isEdge;

    // formation scan: a light band sweeps the building bottom → top while
    // it draws in, then disappears
    float formP = smoothstep(0.30, 0.52, uP);
    float scanY = mix(-uBH * 0.60, uBH * 0.62, formP);
    vScan = exp(-pow((bl.y - scanY) * 2.4, 2.0)) * (1.0 - step(0.999, formP)) * step(0.001, formP);
    // low-intensity energy wave traveling across the facades
    vWave = 1.0 + 0.07 * sin(bl.x * 1.6 + bl.y * 2.1 - uTime * 1.3);

    vec3 b = bl + uBOff;   // grounded on the code floor, slightly right

    // ---- Brain: the building dissolves into a living mind --------------
    // Roles by seed: cortex glyphs (most), neuron somas (~10%, pulsing
    // round nodes) and traveling signals (~10%, round sparks running
    // between two cortex points — the neural firings). Firing density
    // multiplies as the page scrolls deeper; the whole brain drifts from
    // the right toward the left while slowly turning.
    float wBr = wG;
    float isSig = step(0.90, aSeed);
    float isNode = step(0.80, aSeed) - isSig;
    // connections come alive with scroll depth
    float act = step(fract(aSeed * 57.31), 0.20 + uDoc * 0.80);
    float trip = fract(uTime * (0.22 + aSeed * 0.45) + aSeed * 13.0);
    vec3 br = mix(aBrain, mix(aBrain, aBrain2, trip), isSig);
    // slow turn + breathing
    float bra = uTime * 0.05 + uDoc * 0.9;
    float bc = cos(bra);
    float bs = sin(bra);
    br.xz = vec2(br.x * bc - br.z * bs, br.x * bs + br.z * bc);
    br *= 1.0 + 0.015 * sin(uTime * 1.1 + aSeed * 2.0);
    br.y += sin(uTime * 0.5 + aSeed * 9.42) * 0.04;
    // right → left journey as the page scrolls down
    float travel = smoothstep(0.12, 0.85, uDoc);
    br.x += mix(1.7, -2.4, travel);
    br.y += -0.1 - travel * 0.5;
    vSig = isSig * act;
    vNode = isNode;

    // ---- Blend ---------------------------------------------------------
    vec3 pos = mix(sea, gather, toGather);
    pos = mix(pos, b, wB);
    pos = mix(pos, br, wBr);

    // turbulence only while mid-morph, so the dissolve reads as physical
    float bell = wBr * (1.0 - wBr) * 2.0;
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
    // building keeps tighter glyphs; neuron nodes and firings get weight
    float formed = clamp(wB + wBr, 0.0, 1.0);
    float sizeBoost = mix(1.7, 1.0, formed) + wBr * (0.15 + 0.45 * (vSig + vNode));
    gl_PointSize = aSize * sizeBoost * uSizeMul * uPR * (12.5 / max(-mv.z, 0.5));

    // ---- Alpha ---------------------------------------------------------
    float fogA = 1.0 - depthFrac * 0.62;                       // depth fog
    float nearFade = smoothstep(6.0, 3.2, sea.z);
    float seaA = (0.55 + crest * 0.3) * fogA * max(nearFade, toGather)
               + skyline * 0.3 + underGlow * 0.16;
    float a = mix(seaA, 0.5, toGather * 0.85);
    // three-density hologram: edges carry the form, surfaces fill it at
    // lower brightness (rear suppressed so facades don't pile into fog),
    // interior stays a faint depth veil; the formation band adds light
    float bAlpha = isEdge * (0.5 + 0.3 * depthShade)
                 + isSurf * 0.7 * (0.22 + 0.78 * pow(depthShade, 1.8))
                 + isInt * 0.1;
    bAlpha += vScan * 0.35;
    a = mix(a, bAlpha, wB);
    // brain: cortex glyphs stay soft, somas pulse, firings flash bright —
    // and inactive signal particles disappear entirely
    float brainA = 0.42
                 + isNode * 0.35
                 + isSig * (act * 0.6 - 0.42);
    a = mix(a, brainA, wBr);
    a += smoothstep(1.35, 0.0, md) * 0.25;                     // pointer glow
    vAlpha = a * uDim;

    vGlyph = aGlyph;
    vB = wB;
    vBr = wBr;
    vLayer = aLayer;
    vCrest = crest;
    vLum = aLum;
    vEdge = aEdge;
    vSeed = aSeed;
    vPulse = 0.6 + 0.4 * sin(uTime * 2.2 + aSeed * 25.0);
    // sea + building stay pure Matrix glyphs; neuron somas and traveling
    // firings render as round energy points inside the brain
    vDot = (isSig + isNode) * smoothstep(0.3, 0.6, wBr);
  }
`;

const fragmentShader = /* glsl */ `
  uniform sampler2D uAtlas;
  varying float vGlyph;
  varying float vB;
  varying float vBr;
  varying float vCrest;
  varying float vLum;
  varying float vEdge;
  varying float vSeed;
  varying float vAlpha;
  varying float vDot;
  varying float vPulse;
  varying float vLit;
  varying float vRim;
  varying float vScan;
  varying float vLayer;
  varying float vWave;
  varying float vSig;
  varying float vNode;

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
    // building palette — 65% dark gray / off-white, 25% pale holographic
    // green, 10% strong acid accent (edges + energy only)
    float isEdgeL = 1.0 - step(0.5, vLayer);
    float bLum = (0.22 + 0.78 * vLum) * vLit;
    float pale = step(0.10, vSeed) * (1.0 - step(0.35, vSeed));
    float strong = (1.0 - step(0.10, vSeed)) * isEdgeL;
    vec3 gray = mix(vec3(0.46, 0.48, 0.50), vec3(0.93, 0.95, 0.97), bLum);
    vec3 paleGreen = mix(vec3(0.40, 0.55, 0.44), vec3(0.64, 0.88, 0.62), bLum);
    vec3 buildCol = mix(gray, paleGreen, pale) * vWave;
    buildCol *= 1.0 + isEdgeL * 0.35;                       // edges sharper
    buildCol = mix(buildCol, lime, strong * (0.5 + 0.5 * vLit));
    buildCol += lime * vRim * 0.55;                         // silhouette rim
    buildCol += lime * vScan * 0.6;                         // formation band
    // brain: warm off-white cortex codes, pale-green pulsing somas and
    // bright lime firing sparks racing between them
    vec3 brCol = vec3(0.82, 0.83, 0.86);
    brCol = mix(brCol, vec3(0.55, 0.78, 0.50) * (0.7 + 0.5 * vPulse), vNode);
    brCol = mix(brCol, lime * (0.8 + 0.4 * vPulse), vSig);

    vec3 col = mix(seaCol, buildCol, vB);
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
    const normalsArr = new Float32Array(n * 3);
    const brains = new Float32Array(n * 3);
    const brains2 = new Float32Array(n * 3);

    // Realistic-leaning procedural cortex: deformed sphere with layered
    // gyri ripples, longitudinal fissure, flattened base, hemisphere gap
    // and a ~10% cerebellum lobe tucked low at the back. Deterministic.
    const BRAIN_SCALE = 2.7;
    const brainPoint = (k: number): [number, number, number] => {
      const bu = hash(k);
      const bv = hash(k + 50000);
      if (hash(k + 90000) < 0.1) {
        // cerebellum
        const t2 = bu * Math.PI * 2;
        const p2 = Math.acos(2 * bv - 1);
        const wr2 = Math.sin(Math.cos(t2) * 9.0 + Math.sin(p2) * 7.0);
        const r2 = 0.34 * (1 + wr2 * 0.05);
        return [
          Math.sin(p2) * Math.cos(t2) * r2 * 1.1 * BRAIN_SCALE,
          (Math.cos(p2) * r2 * 0.7 - 0.52) * BRAIN_SCALE + 0.3,
          (Math.sin(p2) * Math.sin(t2) * r2 - 0.72) * BRAIN_SCALE,
        ];
      }
      const theta = bu * Math.PI * 2;
      const phi = Math.acos(2 * bv - 1);
      let bx = Math.sin(phi) * Math.cos(theta);
      let by = Math.cos(phi);
      let bz = Math.sin(phi) * Math.sin(theta);
      const wrinkle =
        Math.sin(bx * 6.2 + bz * 4.1 + by * 3.0) *
          Math.sin(bz * 7.3 - bx * 5.2 + by * 2.1) +
        0.5 * Math.sin(bx * 11.0 - bz * 9.0 + by * 5.0);
      let rr = 1 + wrinkle * 0.06;
      const fissure = Math.max(0, 1 - Math.abs(bx) / 0.13) * Math.max(0, by + 0.1);
      rr -= fissure * 0.2;
      bx *= 0.84 * rr;
      by *= 0.74 * rr;
      bz *= 1.08 * rr;
      bx += Math.sign(bx) * 0.04;
      if (by < -0.4) by = -0.4 + (by + 0.4) * 0.45;
      return [bx * BRAIN_SCALE, by * BRAIN_SCALE + 0.3, bz * BRAIN_SCALE];
    };
    const delays = new Float32Array(n);
    const sizes = new Float32Array(n);
    const glyphs = new Float32Array(n);
    const edges = new Float32Array(n);
    const layersArr = new Float32Array(n);
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
      if (sample.normals) {
        normalsArr[i * 3] = sample.normals[s * 3];
        normalsArr[i * 3 + 1] = sample.normals[s * 3 + 1];
        normalsArr[i * 3 + 2] = sample.normals[s * 3 + 2];
      } else {
        normalsArr[i * 3 + 2] = 1; // image plane: everything faces the camera
      }
      delays[i] = sample.delays[s];
      layersArr[i] = sample.layers ? sample.layers[s] : 1;
      edges[i] = sample.layers
        ? (sample.layers[s] === 0 ? 1 : 0)
        : sample.accents[s] > 0 || sample.sizes[s] > 7
          ? 1
          : 0;
      lums[i] = sample.lums[s];
      sizes[i] = sample.sizes[s] * 0.9;

      glyphs[i] = Math.floor(hash(i + 600000) * GLYPH_COUNT);
      seeds[i] = hash(i + 700000);

      // brain slot + a distinct partner point — firings travel between them
      const bp = brainPoint(i + 800000);
      brains[i * 3] = bp[0];
      brains[i * 3 + 1] = bp[1];
      brains[i * 3 + 2] = bp[2];
      const bp2 = brainPoint(i + 1700000);
      brains2[i * 3] = bp2[0];
      brains2[i * 3 + 1] = bp2[1];
      brains2[i * 3 + 2] = bp2[2];
    }

    const geo = new THREE.BufferGeometry();
    // `position` is required by three but unused — sea is derived in-shader.
    geo.setAttribute("position", new THREE.BufferAttribute(seas, 3));
    geo.setAttribute("aSea", new THREE.BufferAttribute(seas, 3));
    geo.setAttribute("aStart", new THREE.BufferAttribute(startsArr, 3));
    geo.setAttribute("aBuild", new THREE.BufferAttribute(builds, 3));
    geo.setAttribute("aNormal", new THREE.BufferAttribute(normalsArr, 3));
    geo.setAttribute("aLayer", new THREE.BufferAttribute(layersArr, 1));
    geo.setAttribute("aBrain", new THREE.BufferAttribute(brains, 3));
    geo.setAttribute("aBrain2", new THREE.BufferAttribute(brains2, 3));
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
        uBOff: {
          value: new THREE.Vector3(
            0.35,
            sample.dims ? -2.3 + sample.dims.h / 2 + 0.02 : 0.45,
            0
          ),
        },
        uBH: { value: sample.dims?.h ?? 3.4 },
        uSizeMul: { value: 1 },
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
    u.uSizeMul.value = state.size.width < state.size.height ? 1.8 : 1;

    // Damped scroll progress → weights → flow speed (eased, never zero).
    const p = THREE.MathUtils.damp(u.uP.value, experience.hero, 5, delta);
    u.uP.value = p;
    const w = phaseWeights(p);
    seaOffRef.current += w.flow * 6.2 * delta;
    u.uSeaOff.value = seaOffRef.current;
    // three-quarter resting yaw; dissolve rotates gently counterclockwise
    u.uSpin.value = BUILDING_BASE_YAW - w.spin * 0.55;
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
