// Device performance tiers. Decided once on the client; every particle
// budget, DPR cap and effect toggle derives from this so density adapts
// without scattering `navigator` checks across components.

export type QualityTier = "high" | "mid" | "low";

export interface QualityProfile {
  tier: QualityTier;
  /** particles in the unified morph field (sea = all, building uses a subset) */
  particleCount: number;
  buildingSamples: number;
  maxDpr: number;
  pointerEffects: boolean;
}

export function detectQuality(): QualityProfile {
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  const mem = (navigator as { deviceMemory?: number }).deviceMemory ?? 8;
  const small = window.innerWidth < 820;

  if (coarse || small || cores <= 4 || mem <= 2) {
    return {
      tier: "low",
      particleCount: 2200,
      buildingSamples: 1800,
      maxDpr: 1,
      pointerEffects: !coarse,
    };
  }
  if (cores <= 8 || mem <= 4) {
    return {
      tier: "mid",
      particleCount: 4200,
      buildingSamples: 3800,
      maxDpr: 1.5,
      pointerEffects: true,
    };
  }
  return {
    tier: "high",
    particleCount: 7200,
    buildingSamples: 6200,
    maxDpr: 1.5,
    pointerEffects: true,
  };
}

export function supportsWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") || canvas.getContext("webgl"))
    );
  } catch {
    return false;
  }
}
