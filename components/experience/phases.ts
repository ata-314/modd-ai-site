// Central scroll timeline for the whole particle experience. Every component
// and shader reads these constants — never hardcode phase boundaries inline.
//
// `hero` progress (0→1 across the hero's pinned scroll distance):
//   0.00–0.15  dense, fast code ocean
//   0.15–0.35  flow decelerates, building begins to form
//   0.35–0.48  code building completes
//   0.48–0.62  building holds, gains subtle 3D depth / rotation lead-in
//   0.62–0.82  building rotates apart and morphs into the galaxy
//   0.82–1.00  galactic field takes over and persists below the hero

export const PHASES = {
  seaFastEnd: 0.15,
  buildStart: 0.15,
  buildEnd: 0.48,
  holdEnd: 0.62,
  dissolveEnd: 0.82,
} as const;

/** Hero pinned scroll distance (vh). Raising this stretches every phase. */
export const HERO_SCROLL_VH = 460;

/** Resting yaw: the building faces the camera corner-on, like the photo. */
export const BUILDING_BASE_YAW = 0.62;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};

export interface PhaseWeights {
  /** 0→1 particles snapped onto the building */
  building: number;
  /** 0→1 particles morphed into the galaxy */
  galaxy: number;
  /** sea flow speed factor: 1 at rest, floors near 0.18 (never fully stops) */
  flow: number;
  /** building Y-rotation (radians) during hold + dissolve */
  spin: number;
}

/** JS mirror of the shader's phase math — keep the two in sync. */
export function phaseWeights(p: number): PhaseWeights {
  const building =
    smoothstep(PHASES.buildStart, PHASES.buildEnd, p) *
    (1 - smoothstep(PHASES.holdEnd, PHASES.dissolveEnd, p));
  const galaxy = smoothstep(PHASES.holdEnd, PHASES.dissolveEnd + 0.04, p);
  const flow = 0.18 + 0.82 * (1 - smoothstep(PHASES.seaFastEnd, PHASES.buildEnd, p));
  const spin = smoothstep(PHASES.buildEnd, PHASES.dissolveEnd, p) * 1.3;
  return { building, galaxy, flow, spin };
}
