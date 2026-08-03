export interface Service {
  num: string;
  title: string;
  description: string;
  detail: string;
}

export const services: Service[] = [
  {
    num: "01",
    title: "AI Films",
    description: "Cinematic film production without camera or set — from idea to final frame.",
    detail:
      "Concept, direction, generative production, edit and grade. Fully AI-produced film, controlled shot by shot by human directors.",
  },
  {
    num: "02",
    title: "Creative Campaigns",
    description: "Campaign ideas built and produced with generative systems at agency standards.",
    detail:
      "Strategy-led campaign development where AI multiplies executions and the creative team keeps the idea sharp.",
  },
  {
    num: "03",
    title: "Digital Experiences",
    description: "Interactive, real-time and web-based experiences that make brands felt, not just seen.",
    detail:
      "WebGL scenes, generative visuals and interactive storytelling — engineered for performance on real devices.",
  },
  {
    num: "04",
    title: "Brand Systems",
    description: "Generative identity systems that keep a brand consistent at machine scale.",
    detail:
      "Design tokens, visual recipes and AI production pipelines that let a brand produce endlessly without drifting off-model.",
  },
];
