// Vertical 9:16 work reels for the auto-scrolling slider. Set `src` to a
// hosted mp4/webm when real media lands — cards render placeholders until
// then. Order = display order.
export interface Reel {
  id: string;
  title: string;
  tag: string;
  src: string | null;
}

export const reels: Reel[] = [
  { id: "r01", title: "Reel 01", tag: "AI Film", src: null },
  { id: "r02", title: "Reel 02", tag: "Brand Motion", src: null },
  { id: "r03", title: "Reel 03", tag: "Product CGI", src: null },
  { id: "r04", title: "Reel 04", tag: "Campaign", src: null },
  { id: "r05", title: "Reel 05", tag: "Social Cut", src: null },
  { id: "r06", title: "Reel 06", tag: "Concept", src: null },
];
