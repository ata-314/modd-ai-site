export interface ProcessStage {
  num: string;
  title: string;
  description: string;
  indicator: string;
}

export const processStages: ProcessStage[] = [
  {
    num: "01",
    title: "Discover",
    description:
      "We map the brand, the audience and the ambition. What should exist that doesn't yet?",
    indicator: "input :: brief_analysis",
  },
  {
    num: "02",
    title: "Direct",
    description:
      "Human creative direction sets the frame — references, tone, composition, story.",
    indicator: "human_control = true",
  },
  {
    num: "03",
    title: "Generate",
    description:
      "Generative systems produce at scale inside the frame we set. Hundreds of iterations, one intent.",
    indicator: "render_frame 0001…n",
  },
  {
    num: "04",
    title: "Refine",
    description:
      "Selection, grading, retouch and finish. Only what passes human judgment ships.",
    indicator: "qc :: pass_required",
  },
];
