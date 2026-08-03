import * as THREE from "three";

// 4x4 atlas of terminal characters rendered once to a canvas texture.
const GLYPHS = ["0", "1", "{", "}", "<", ">", "/", ";", ":", "+", "x", "y", "z", "=", "*", "#"];

export function createGlyphAtlas(): THREE.CanvasTexture {
  const size = 256;
  const cell = size / 4;
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
    const cx = (i % 4) * cell + cell / 2;
    const cy = Math.floor(i / 4) * cell + cell / 2;
    ctx.fillText(g, cx, cy);
  });
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}
