// Shared mutable state for the global experience. Plain refs, no React
// state — writers (ScrollTrigger, pointer listeners) mutate per event and
// readers (useFrame loops) sample per frame. One source of truth so the same
// scroll value is never computed twice.

export interface ExperienceState {
  /** hero pinned-scroll progress 0→1 (drives sea → building → galaxy) */
  hero: number;
  /** whole-document progress 0→1 (drives galaxy drift below the hero) */
  doc: number;
  /** smoothed |scroll| px/frame — galaxy firing/energy responds to it */
  scrollVel: number;
  /** pointer in normalized device coords (-1..1), y up */
  pointerX: number;
  pointerY: number;
  /** heavy WebGL assets sampled + first frame drawn */
  ready: boolean;
}

export const experience: ExperienceState = {
  hero: 0,
  doc: 0,
  scrollVel: 0,
  pointerX: 0,
  pointerY: 0,
  ready: false,
};

type ReadyListener = () => void;
const readyListeners = new Set<ReadyListener>();

export function markExperienceReady() {
  if (experience.ready) return;
  experience.ready = true;
  readyListeners.forEach((fn) => fn());
  readyListeners.clear();
}

/** Fires immediately if already ready. Returns an unsubscribe. */
export function onExperienceReady(fn: ReadyListener): () => void {
  if (experience.ready) {
    fn();
    return () => {};
  }
  readyListeners.add(fn);
  return () => readyListeners.delete(fn);
}
