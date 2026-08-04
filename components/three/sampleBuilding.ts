// Samples the building PNG's alpha channel to generate particle targets.
// Edge pixels (silhouette + architectural lines) are detected via neighbor
// alpha difference and get earlier reveal delays and accent colors.

export interface BuildingSample {
  count: number;
  starts: Float32Array; // scattered origin positions
  targets: Float32Array; // positions on the building
  delays: Float32Array; // 0..0.6 stagger inside scroll progress
  sizes: Float32Array;
  glyphs: Float32Array; // atlas cell index
  accents: Float32Array; // 1 = lime, 0 = gray
  lums: Float32Array; // facade pixel luminance — glyphs render the image
}

const GRID_W = 300;

export async function sampleBuilding(
  url: string,
  count: number,
  planeW: number,
  planeH: number
): Promise<BuildingSample> {
  const img = new Image();
  img.src = url;
  await img.decode();

  const gw = GRID_W;
  const gh = Math.round(gw * (img.naturalHeight / img.naturalWidth));
  const canvas = document.createElement("canvas");
  canvas.width = gw;
  canvas.height = gh;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, gw, gh);
  const data = ctx.getImageData(0, 0, gw, gh).data;

  const alphaAt = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= gw || y >= gh) return 0;
    return data[(y * gw + x) * 4 + 3];
  };
  const lumAt = (x: number, y: number) => {
    const i = (y * gw + x) * 4;
    return (0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]) / 255;
  };

  const edges: Array<[number, number]> = [];
  const fills: Array<[number, number]> = [];
  for (let y = 0; y < gh; y++) {
    for (let x = 0; x < gw; x++) {
      if (alphaAt(x, y) < 110) continue;
      const isEdge =
        alphaAt(x - 1, y) < 110 ||
        alphaAt(x + 1, y) < 110 ||
        alphaAt(x, y - 1) < 110 ||
        alphaAt(x, y + 1) < 110;
      (isEdge ? edges : fills).push([x, y]);
    }
  }

  const picked: Array<{ x: number; y: number; edge: boolean }> = [];
  const edgeQuota = Math.min(edges.length, Math.floor(count * 0.45));
  for (let i = 0; i < edgeQuota; i++) {
    const [x, y] = edges[Math.floor(Math.random() * edges.length)];
    picked.push({ x, y, edge: true });
  }
  while (picked.length < count && fills.length > 0) {
    const [x, y] = fills[Math.floor(Math.random() * fills.length)];
    picked.push({ x, y, edge: false });
  }

  const n = picked.length;
  const starts = new Float32Array(n * 3);
  const targets = new Float32Array(n * 3);
  const delays = new Float32Array(n);
  const sizes = new Float32Array(n);
  const glyphs = new Float32Array(n);
  const accents = new Float32Array(n);
  const lums = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const { x, y, edge } = picked[i];
    const u = x / gw;
    const v = y / gh;

    starts[i * 3] = (Math.random() - 0.5) * planeW * 1.7;
    starts[i * 3 + 1] = (Math.random() - 0.5) * planeH * 2.6;
    starts[i * 3 + 2] = (Math.random() - 0.5) * 3.2;

    // Luminance with stretched contrast so signage and windows read.
    const rawLum = lumAt(x, y);
    const lum = Math.min(1, Math.max(0, (rawLum - 0.5) * 1.35 + 0.5));
    const bright = lum > 0.72; // signage / lit surfaces

    // The glyphs ARE the building. Depth is a luminance bas-relief: bright
    // surfaces push forward, dark windows recede — rotation reads as 3D.
    targets[i * 3] = (u - 0.5) * planeW;
    targets[i * 3 + 1] = (0.5 - v) * planeH;
    targets[i * 3 + 2] =
      (lum - 0.45) * 0.55 + (edge ? 0.06 : 0) + (Math.random() - 0.5) * 0.05;

    // Roof first, edges + signage before fills, slight jitter.
    delays[i] = Math.min(
      0.6,
      v * 0.38 + (edge || bright ? 0 : 0.14) + Math.random() * 0.07
    );
    sizes[i] = edge || bright ? 7 + Math.random() * 4 : 5 + Math.random() * 3;
    glyphs[i] = Math.floor(Math.random() * 16);
    accents[i] = (edge ? Math.random() < 0.22 : Math.random() < 0.04) ? 1 : 0;
    lums[i] = lum;
  }

  return { count: n, starts, targets, delays, sizes, glyphs, accents, lums };
}
