import * as THREE from "three";

// 8x8 atlas — digits, half-width katakana, math/code symbols and a row of
// short technical tokens (shader/system fragments + MODD-AI words). Shaders
// address cells with `ATLAS_GRID`; keep GLYPHS.length === ATLAS_GRID².
export const ATLAS_GRID = 8;

const GLYPHS = [
  "0", "1", "2", "3", "4", "7", "8", "9",
  "ｱ", "ｲ", "ｳ", "ｴ", "ｵ", "ｶ", "ｷ", "ｸ",
  "ｹ", "ｺ", "ｻ", "ｼ", "ｽ", "ﾀ", "ﾁ", "ﾂ",
  "ﾃ", "ﾄ", "ﾅ", "ﾈ", "ﾉ", "ﾊ", "ﾋ", "ﾏ",
  "ﾐ", "ﾑ", "ﾒ", "ﾓ", "ﾔ", "ﾗ", "ﾘ", "ﾜ",
  "+", "-", "=", "*", "/", "<", ">", "#",
  "{", "}", "[", "]", ":", ";", "%", "&",
  "vec3", "fx()", "0xF3", "MODD", "AI", "x:41", "y:12", "sys",
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
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  GLYPHS.forEach((g, i) => {
    // multi-char tokens shrink to fit their cell
    const f = g.length > 1 ? cell / (g.length * 0.62) : cell * 0.72;
    ctx.font = `500 ${f}px "JetBrains Mono", ui-monospace, monospace`;
    const cx = (i % ATLAS_GRID) * cell + cell / 2;
    const cy = Math.floor(i / ATLAS_GRID) * cell + cell / 2;
    ctx.fillText(g, cx, cy);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
