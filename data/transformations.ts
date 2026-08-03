// Before/After pairs + production pipeline stages.
// Media slots are empty until the human provides files — drop paths (from
// /public) or URLs into `src`; the UI renders labeled placeholders meanwhile.

export interface ComparisonSide {
  src: string;
  label: string;
}

export interface Comparison {
  id: string;
  title: string;
  before: ComparisonSide;
  after: ComparisonSide;
}

export const comparisons: Comparison[] = [
  {
    id: "render-to-film",
    title: "Lifeless render → cinematic frame",
    before: { src: "", label: "BEFORE — raw render" },
    after: { src: "", label: "AFTER — AI-graded frame" },
  },
];

export interface PipelineStage {
  num: string;
  title: string;
  description: string;
  media: string; // image or video path — empty renders a placeholder
  tag: string;
}

export const pipelineStages: PipelineStage[] = [
  {
    num: "01",
    title: "Sketch",
    description: "A SketchUp draft — massing, lines, intent. No light, no life yet.",
    media: "",
    tag: "input :: sketchup_draft",
  },
  {
    num: "02",
    title: "Render",
    description: "The draft becomes a photoreal still — materials, light, atmosphere.",
    media: "",
    tag: "process :: ai_render",
  },
  {
    num: "03",
    title: "Film",
    description: "The still starts moving — camera, pacing, sound. A cinematic sequence.",
    media: "",
    tag: "output :: motion_film",
  },
];
