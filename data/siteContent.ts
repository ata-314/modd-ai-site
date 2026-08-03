// Central content config — edit copy, links, and asset paths here.

export const siteContent = {
  brand: "MODD-AI",
  hero: {
    line1: "Not one click AI.",
    line2: "Artist + AI.",
    subline: "Human-directed creativity, amplified by artificial intelligence.",
    ctaPrimary: { label: "Explore Our Work", href: "#work" },
    ctaSecondary: { label: "Start a Project", href: "#contact" },
    building: {
      texture: "/building/bina.png",
      fallback: "/building/bina.png",
      fallbackMobile: "/building/bina-mobile.png",
      alt: "MODD group building emerging as a digital structure made of code",
    },
    codeSnippets: [
      "generative_system :: active",
      "creative_direction — human",
      "artist_input > 0.99",
      "render_frame 0221 / 0600",
      "x: 41.02  y: 12.77  z: 3.14",
      "01001101 01001111 01000100 01000100",
      "vec3 facade = mix(concrete, signal, 0.35);",
      "human_control = true",
    ],
    loader: {
      title: "MODD-AI",
      caption: "INITIALIZING CREATIVE SYSTEM",
      lines: [
        "import creative_system",
        "loading facade_geometry ... ok",
        "compiling shaders [vert/frag] ... ok",
        "sampling silhouette :: 9000 pts ... ok",
        "binding artist_input ...",
        "human_control = true",
      ],
    },
    // Marquee strip at the hero's bottom edge. Keyword-based for now —
    // swap in approved client brand names/logos when the human provides them.
    marquee: [
      "AI Films",
      "Creative Campaigns",
      "Digital Experiences",
      "Brand Systems",
      "Artist + AI",
      "MODD/group — 15 years",
      "300+ brand references",
    ],
  },
  showreel: {
    // Drop the real showreel URL + poster here; empty src renders a clearly
    // labeled placeholder frame instead.
    src: "",
    poster: "",
    label: "Showreel",
    placeholderNote: "Showreel — placeholder · real reel pending",
  },
  manifesto: {
    heading: ["AI does not replace the artist.", "It expands the possible."],
    body: "MODD-AI is the AI studio of MODD/group. We direct generative systems the way a director runs a set — with taste, intent, and a point of view. The machine iterates at scale; the artist decides what matters. Every frame we ship passes through human judgment before it reaches the world.",
  },
  philosophy: {
    human: {
      title: "HUMAN",
      items: ["Taste", "Emotion", "Direction", "Story"],
    },
    machine: {
      title: "MACHINE",
      items: ["Scale", "Iteration", "Simulation", "Speed"],
    },
    center: "MODD-AI",
    caption:
      "Creative direction and computation, fused. The hand stays on the wheel.",
  },
  cta: {
    line: "Let's create what doesn't exist yet.",
    button: { label: "Start a Project", href: "#contact" },
  },
  footer: {
    nav: [
      { label: "Work", href: "#work" },
      { label: "Services", href: "#services" },
      { label: "About", href: "#about" },
      { label: "Contact", href: "#contact" },
    ],
    instagram: { label: "Instagram — @modd_ai", href: "https://www.instagram.com/modd_ai" },
    email: "ataberk@moddworks.com",
    website: { label: "www.moddworks.com", href: "https://www.moddworks.com" },
    location: "Türkiye · UK · USA",
    copyright: `© ${new Date().getFullYear()} MODD/group. All rights reserved.`,
  },
} as const;
