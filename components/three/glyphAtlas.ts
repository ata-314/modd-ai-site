import * as THREE from "three";

// 8x8 atlas of Matrix glyphs — digits, half-width katakana, math symbols and
// short code marks — rendered once to a canvas texture. Shaders address cells
// with `ATLAS_GRID`; keep GLYPHS.length === ATLAS_GRID².
export const ATLAS_GRID = 8;

const GLYPHS = [
  "0", "1", "2", "3", "4", "5", "6", "7",
  "8", "9", "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ",
  "ｷ", "ｸ", "ｹ", "ｺ", "ｻ", "ｼ", "ｽ", "ｾ",
  "ｿ", "ﾀ", "ﾁ", "ﾂ", "ﾃ", "ﾄ", "ﾅ", "ﾈ",
  "ﾉ", "ﾊ", "ﾋ", "ﾌ", "ﾍ", "ﾎ", "ﾏ", "ﾐ",
  "ﾑ", "ﾒ", "ﾓ", "ﾔ", "ﾕ", "ﾖ", "ﾗ", "ﾘ",
  "ﾙ", "ﾚ", "ﾛ", "ﾜ", "ﾝ", "+", "-", "=",
  "*", "/", "<", ">", "{", "}", ":", "#",
];

export const GLYPH_COUNT = GLYPHS.length;

export function createGlyphAtlas(): THREE.CanvasTexture {
  const size = 512;
  const cell = size / ATLAS_GRID;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, size, size);
  ctx.fillStyle = "#ffffff";
  ctx.font = `500 ${cell * 0.72}px "JetBrains Mono", ui-monospace, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  GLYPHS.forEach((g, i) => {
    const cx = (i % ATLAS_GRID) * cell + cell / 2;
    const cy = Math.floor(i / ATLAS_GRID) * cell + cell / 2;
    ctx.fillText(g, cx, cy);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
