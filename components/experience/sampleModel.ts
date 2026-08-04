import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { BuildingSample } from "@/components/three/sampleBuilding";
import { GLYPH_COUNT } from "@/components/three/glyphAtlas";

// Samples particle targets from the real 3D model (GLB, geometry + UVs) and
// reads each point's brightness from the facade texture — so the glyphs
// reproduce the actual building surface, signage included, without the
// photo or texture ever being rendered. Area-weighted triangle sampling
// with barycentric interpolation of position / normal / UV.

const MODEL_URL = "/models/building.glb";
const FACADE_URL = "/models/facade.jpg";
const TEX_SIZE = 1024;

interface TriMesh {
  pos: Float32Array;
  nor: Float32Array | null;
  uv: Float32Array | null;
  index: Uint32Array | Uint16Array | null;
  matrix: THREE.Matrix4;
  cumArea: Float64Array; // cumulative triangle areas for weighted picking
  totalArea: number;
}

async function loadFacade(): Promise<{ data: Uint8ClampedArray; w: number; h: number } | null> {
  try {
    const res = await fetch(FACADE_URL);
    if (!res.ok) return null;
    const bitmap = await createImageBitmap(await res.blob());
    const w = Math.min(bitmap.width, TEX_SIZE);
    const h = Math.min(bitmap.height, TEX_SIZE);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();
    return { data: ctx.getImageData(0, 0, w, h).data, w, h };
  } catch {
    return null;
  }
}

function buildTriMesh(mesh: THREE.Mesh): TriMesh | null {
  const geo = mesh.geometry as THREE.BufferGeometry;
  const posAttr = geo.attributes.position as THREE.BufferAttribute | undefined;
  if (!posAttr) return null;
  const pos = posAttr.array as Float32Array;
  const nor = (geo.attributes.normal?.array as Float32Array) ?? null;
  const uv = (geo.attributes.uv?.array as Float32Array) ?? null;
  const index = (geo.index?.array as Uint32Array | Uint16Array) ?? null;
  const triCount = (index ? index.length : posAttr.count) / 3;

  const cumArea = new Float64Array(triCount);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let total = 0;
  for (let t = 0; t < triCount; t++) {
    const i0 = (index ? index[t * 3] : t * 3) * 3;
    const i1 = (index ? index[t * 3 + 1] : t * 3 + 1) * 3;
    const i2 = (index ? index[t * 3 + 2] : t * 3 + 2) * 3;
    a.fromArray(pos, i0);
    b.fromArray(pos, i1);
    c.fromArray(pos, i2);
    b.sub(a);
    c.sub(a);
    total += b.cross(c).length() * 0.5;
    cumArea[t] = total;
  }
  if (total <= 0) return null;
  return { pos, nor, uv, index, matrix: mesh.matrixWorld.clone(), cumArea, totalArea: total };
}

function pickTriangle(cum: Float64Array, r: number): number {
  let lo = 0;
  let hi = cum.length - 1;
  const target = r * cum[hi];
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cum[mid] < target) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

export async function sampleModel(count: number, planeW: number): Promise<BuildingSample> {
  const [gltf, facade] = await Promise.all([
    new GLTFLoader().loadAsync(MODEL_URL),
    loadFacade(),
  ]);
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);

  const tris: TriMesh[] = [];
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      const tm = buildTriMesh(mesh);
      if (tm) tris.push(tm);
    }
  });
  if (tris.length === 0) throw new Error("model has no meshes");
  const totalArea = tris.reduce((s, t) => s + t.totalArea, 0);

  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = planeW / Math.max(size.x, 1e-6);

  const n = count;
  const starts = new Float32Array(n * 3);
  const targets = new Float32Array(n * 3);
  const delays = new Float32Array(n);
  const sizes = new Float32Array(n);
  const glyphs = new Float32Array(n);
  const accents = new Float32Array(n);
  const lums = new Float32Array(n);

  const p = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  const light = new THREE.Vector3(0.5, 0.85, 0.6).normalize();

  // Barycentric UV holders — set inside the retry loop below.
  let uvA = 0;
  let uvB = 0;
  let uvC = 0;
  let uvW = { i0: 0, i1: 0, i2: 0, tm: tris[0] };

  for (let i = 0; i < n; i++) {
    // Rejection-sample the front of the building: back-facing surfaces
    // (they'd project on top of the facade and turn it to mush) and the
    // flat ground the generator adds under the model are both skipped.
    let tries = 0;
    let nyTmp = 0;
    for (;;) {
      let meshPick = Math.random() * totalArea;
      let tm = tris[0];
      for (const t of tris) {
        meshPick -= t.totalArea;
        if (meshPick <= 0) {
          tm = t;
          break;
        }
      }
      const t = pickTriangle(tm.cumArea, Math.random());
      const i0 = tm.index ? tm.index[t * 3] : t * 3;
      const i1 = tm.index ? tm.index[t * 3 + 1] : t * 3 + 1;
      const i2 = tm.index ? tm.index[t * 3 + 2] : t * 3 + 2;
      let bu = Math.random();
      let bv = Math.random();
      if (bu + bv > 1) {
        bu = 1 - bu;
        bv = 1 - bv;
      }
      const bw = 1 - bu - bv;

      v0.fromArray(tm.pos, i0 * 3);
      v1.fromArray(tm.pos, i1 * 3);
      v2.fromArray(tm.pos, i2 * 3);
      p.set(
        v0.x * bw + v1.x * bu + v2.x * bv,
        v0.y * bw + v1.y * bu + v2.y * bv,
        v0.z * bw + v1.z * bu + v2.z * bv
      ).applyMatrix4(tm.matrix);

      if (tm.nor) {
        v0.fromArray(tm.nor, i0 * 3);
        v1.fromArray(tm.nor, i1 * 3);
        v2.fromArray(tm.nor, i2 * 3);
        nrm.set(
          v0.x * bw + v1.x * bu + v2.x * bv,
          v0.y * bw + v1.y * bu + v2.y * bv,
          v0.z * bw + v1.z * bu + v2.z * bv
        );
        normalMatrix.getNormalMatrix(tm.matrix);
        nrm.applyMatrix3(normalMatrix).normalize();
      } else {
        nrm.set(0, 0, 1);
      }

      nyTmp = (p.y - box.min.y) / Math.max(size.y, 1e-6);
      const backFacing = nrm.z < -0.2;
      const groundPlane = nrm.y > 0.7 && nyTmp < 0.06;
      tries++;
      if ((!backFacing && !groundPlane) || tries >= 10) {
        uvA = bw;
        uvB = bu;
        uvC = bv;
        uvW = { i0, i1, i2, tm };
        break;
      }
    }
    const { i0, i1, i2, tm } = uvW;
    const bw = uvA;
    const bu = uvB;
    const bv = uvC;

    // brightness from the real facade texture (glTF UV: v runs top-down)
    let lum: number;
    if (facade && tm.uv) {
      const u = tm.uv[i0 * 2] * bw + tm.uv[i1 * 2] * bu + tm.uv[i2 * 2] * bv;
      const v = tm.uv[i0 * 2 + 1] * bw + tm.uv[i1 * 2 + 1] * bu + tm.uv[i2 * 2 + 1] * bv;
      const tx = Math.min(facade.w - 1, Math.max(0, Math.floor((u % 1 + 1) % 1 * facade.w)));
      const ty = Math.min(facade.h - 1, Math.max(0, Math.floor((v % 1 + 1) % 1 * facade.h)));
      const idx = (ty * facade.w + tx) * 4;
      lum =
        (0.299 * facade.data[idx] + 0.587 * facade.data[idx + 1] + 0.114 * facade.data[idx + 2]) /
        255;
      // stretch contrast so facade lettering pops in the glyph rendering
      lum = Math.min(1, Math.max(0, (lum - 0.5) * 1.35 + 0.5));
    } else {
      lum = 0.22 + 0.78 * Math.max(nrm.dot(light), 0);
    }

    const ny = nyTmp;
    const edge = Math.abs(nrm.y) > 0.6 || Math.random() < 0.14;
    // very bright texels (signage, lit windows) render larger + earlier
    const bright = lum > 0.72;

    targets[i * 3] = (p.x - center.x) * scale;
    targets[i * 3 + 1] = (p.y - center.y) * scale;
    // bas-relief: keep a hint of depth for the rotation, but flatten the
    // model so the facade reads as one crisp silhouette from the front
    targets[i * 3 + 2] = (p.z - center.z) * scale * 0.22;

    starts[i * 3] = (Math.random() - 0.5) * planeW * 1.7;
    starts[i * 3 + 1] = (Math.random() - 0.5) * planeW;
    starts[i * 3 + 2] = (Math.random() - 0.5) * 3.2;

    delays[i] = Math.min(
      0.6,
      (1 - ny) * 0.38 + (edge || bright ? 0 : 0.14) + Math.random() * 0.07
    );
    sizes[i] = edge || bright ? 7 + Math.random() * 4 : 5 + Math.random() * 3;
    glyphs[i] = Math.floor(Math.random() * GLYPH_COUNT);
    accents[i] = (edge ? Math.random() < 0.18 : Math.random() < 0.03) ? 1 : 0;
    lums[i] = lum;
  }

  // The GLTF lives only long enough to be sampled.
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => m?.dispose());
    }
  });

  return { count: n, starts, targets, delays, sizes, glyphs, accents, lums };
}
