import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import type { BuildingSample } from "@/components/three/sampleBuilding";
import { GLYPH_COUNT } from "@/components/three/glyphAtlas";

// Samples the building's particle targets from the real GLB in three
// architectural layers, so the glyph rendering reads as a building and not
// as an even dust:
//   layer 0 — architectural edges (EdgesGeometry): roof lines, corners,
//             window borders, columns — brighter, denser, sharper
//   layer 1 — facades/surfaces (area-weighted triangle sampling with
//             barycentric UVs → real texture luminance, signage included)
//   layer 2 — sparse interior volume: slow, dim depth particles
// The solid model itself is never rendered; it is an invisible source of
// coordinates, normals and edges. Throws if the GLB is missing so the
// caller can report it rather than silently fall back.
//
// NOTE: attributes are accessed via getX/getY/getZ, never via raw `.array` —
// GLTFLoader may load interleaved buffers, where the raw array mixes
// position/normal/uv components (reading it as packed xyz yields a sphere
// of garbage — a bug this file has already lived through once).

const MODEL_URL = "/models/building.glb";
const FACADE_URL = "/models/facade.jpg";
const TEX_SIZE = 1024;

const EDGE_SHARE = 0.16;
const INTERIOR_SHARE = 0.12;
/** crease angle + minimum segment length that counts as architecture —
 * window borders and panel lines stay, micro triangulation junk goes */
const EDGE_ANGLE = 28;
const EDGE_MIN_LEN = 0.04; // in raw model units (~1.9-wide building)

interface TriMesh {
  pos: THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
  nor: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null;
  uv: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | null;
  index: THREE.BufferAttribute | null;
  matrix: THREE.Matrix4;
  cumArea: Float64Array;
  totalArea: number;
  /** world-space edge segments [x1,y1,z1,x2,y2,z2,...] + cumulative lengths */
  edgePos: Float32Array;
  cumEdge: Float64Array;
  totalEdge: number;
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
  const pos = geo.attributes.position;
  if (!pos) return null;
  const nor = geo.attributes.normal ?? null;
  const uv = geo.attributes.uv ?? null;
  const index = geo.index;
  const triCount = (index ? index.count : pos.count) / 3;

  const cumArea = new Float64Array(triCount);
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  let total = 0;
  for (let t = 0; t < triCount; t++) {
    const i0 = index ? index.getX(t * 3) : t * 3;
    const i1 = index ? index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = index ? index.getX(t * 3 + 2) : t * 3 + 2;
    a.fromBufferAttribute(pos, i0);
    b.fromBufferAttribute(pos, i1);
    c.fromBufferAttribute(pos, i2);
    b.sub(a);
    c.sub(a);
    total += b.cross(c).length() * 0.5;
    cumArea[t] = total;
  }
  if (total <= 0) return null;

  // architectural line work: distinct crease edges, keeping only segments
  // long enough to be structure (rooflines, corners, slabs, columns) —
  // short triangulation creases would pepper the facades with bright dots
  const edgesGeo = new THREE.EdgesGeometry(geo, EDGE_ANGLE);
  const ePos = edgesGeo.attributes.position;
  const segTotal = ePos.count / 2;
  const kept: number[] = [];
  const lens: number[] = [];
  for (let s = 0; s < segTotal; s++) {
    a.fromBufferAttribute(ePos, s * 2).applyMatrix4(mesh.matrixWorld);
    b.fromBufferAttribute(ePos, s * 2 + 1).applyMatrix4(mesh.matrixWorld);
    const len = a.distanceTo(b);
    if (len < EDGE_MIN_LEN) continue;
    kept.push(a.x, a.y, a.z, b.x, b.y, b.z);
    lens.push(len);
  }
  edgesGeo.dispose();
  const edgePos = new Float32Array(kept);
  const cumEdge = new Float64Array(lens.length);
  let totalEdge = 0;
  for (let s = 0; s < lens.length; s++) {
    totalEdge += lens[s];
    cumEdge[s] = totalEdge;
  }

  return {
    pos, nor, uv, index,
    matrix: mesh.matrixWorld.clone(),
    cumArea, totalArea: total,
    edgePos, cumEdge, totalEdge,
  };
}

function pickCum(cum: Float64Array, r: number): number {
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
  if (tris.length === 0) throw new Error(`model has no meshes: ${MODEL_URL}`);
  const totalArea = tris.reduce((s, t) => s + t.totalArea, 0);
  const totalEdge = tris.reduce((s, t) => s + t.totalEdge, 0);

  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = planeW / Math.max(size.x, 1e-6);
  const dims = { w: planeW, h: size.y * scale, d: size.z * scale };

  const n = count;
  const starts = new Float32Array(n * 3);
  const targets = new Float32Array(n * 3);
  const delays = new Float32Array(n);
  const sizes = new Float32Array(n);
  const glyphs = new Float32Array(n);
  const accents = new Float32Array(n);
  const lums = new Float32Array(n);
  const normals = new Float32Array(n * 3);
  const layers = new Float32Array(n);

  const p = new THREE.Vector3();
  const nrm = new THREE.Vector3();
  const v0 = new THREE.Vector3();
  const v1 = new THREE.Vector3();
  const v2 = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();

  const edgeCount = Math.floor(n * EDGE_SHARE);
  const interiorCount = Math.floor(n * INTERIOR_SHARE);

  const writeTarget = (i: number) => {
    targets[i * 3] = (p.x - center.x) * scale;
    targets[i * 3 + 1] = (p.y - center.y) * scale;
    targets[i * 3 + 2] = (p.z - center.z) * scale;
    normals[i * 3] = nrm.x;
    normals[i * 3 + 1] = nrm.y;
    normals[i * 3 + 2] = nrm.z;
    starts[i * 3] = (Math.random() - 0.5) * planeW * 1.7;
    starts[i * 3 + 1] = (Math.random() - 0.5) * planeW;
    starts[i * 3 + 2] = (Math.random() - 0.5) * 3.2;
    glyphs[i] = Math.floor(Math.random() * GLYPH_COUNT);
  };

  const sampleSurface = () => {
    let pick = Math.random() * totalArea;
    let tm = tris[0];
    for (const t of tris) {
      pick -= t.totalArea;
      if (pick <= 0) {
        tm = t;
        break;
      }
    }
    const t = pickCum(tm.cumArea, Math.random());
    const i0 = tm.index ? tm.index.getX(t * 3) : t * 3;
    const i1 = tm.index ? tm.index.getX(t * 3 + 1) : t * 3 + 1;
    const i2 = tm.index ? tm.index.getX(t * 3 + 2) : t * 3 + 2;
    let bu = Math.random();
    let bv = Math.random();
    if (bu + bv > 1) {
      bu = 1 - bu;
      bv = 1 - bv;
    }
    const bw = 1 - bu - bv;
    v0.fromBufferAttribute(tm.pos, i0);
    v1.fromBufferAttribute(tm.pos, i1);
    v2.fromBufferAttribute(tm.pos, i2);
    p.set(
      v0.x * bw + v1.x * bu + v2.x * bv,
      v0.y * bw + v1.y * bu + v2.y * bv,
      v0.z * bw + v1.z * bu + v2.z * bv
    ).applyMatrix4(tm.matrix);
    if (tm.nor) {
      v0.fromBufferAttribute(tm.nor, i0);
      v1.fromBufferAttribute(tm.nor, i1);
      v2.fromBufferAttribute(tm.nor, i2);
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
    // texture luminance at the barycentric UV (glTF: v runs top-down)
    if (facade && tm.uv) {
      const u = tm.uv.getX(i0) * bw + tm.uv.getX(i1) * bu + tm.uv.getX(i2) * bv;
      const v = tm.uv.getY(i0) * bw + tm.uv.getY(i1) * bu + tm.uv.getY(i2) * bv;
      const tx = Math.min(facade.w - 1, Math.max(0, Math.floor(((u % 1) + 1) % 1 * facade.w)));
      const ty = Math.min(facade.h - 1, Math.max(0, Math.floor(((v % 1) + 1) % 1 * facade.h)));
      const idx = (ty * facade.w + tx) * 4;
      const raw =
        (0.299 * facade.data[idx] + 0.587 * facade.data[idx + 1] + 0.114 * facade.data[idx + 2]) / 255;
      return Math.min(1, Math.max(0, (raw - 0.5) * 1.35 + 0.5));
    }
    return 0.45;
  };

  for (let i = 0; i < n; i++) {
    let layer: number;
    let lum: number;

    if (i < edgeCount) {
      // ---- layer 0: architectural edges -------------------------------
      layer = 0;
      let pick = Math.random() * totalEdge;
      let tm = tris[0];
      for (const t of tris) {
        pick -= t.totalEdge;
        if (pick <= 0) {
          tm = t;
          break;
        }
      }
      const s = pickCum(tm.cumEdge, Math.random());
      const f = Math.random();
      p.set(
        tm.edgePos[s * 6] * (1 - f) + tm.edgePos[s * 6 + 3] * f,
        tm.edgePos[s * 6 + 1] * (1 - f) + tm.edgePos[s * 6 + 4] * f,
        tm.edgePos[s * 6 + 2] * (1 - f) + tm.edgePos[s * 6 + 5] * f
      );
      nrm.copy(p).sub(center).normalize(); // radial proxy — rim reads at any yaw
      lum = 0.8 + Math.random() * 0.2;
    } else if (i < edgeCount + interiorCount) {
      // ---- layer 2: sparse interior volume -----------------------------
      layer = 2;
      sampleSurface();
      const inward = 0.25 + Math.random() * 0.55;
      p.lerp(center, inward);
      nrm.set(0, 1, 0);
      lum = 0.3 + Math.random() * 0.15;
    } else {
      // ---- layer 1: facades / surfaces ---------------------------------
      layer = 1;
      lum = sampleSurface();
    }

    writeTarget(i);
    layers[i] = layer;
    lums[i] = lum;

    // base rises first, edges slightly ahead of their surfaces
    const ny = (p.y - box.min.y) / Math.max(size.y, 1e-6);
    delays[i] = Math.min(
      0.6,
      ny * 0.34 + (layer === 0 ? 0 : 0.1) + Math.random() * 0.05
    );
    const bright = lum > 0.72;
    sizes[i] =
      layer === 0
        ? 5.5 + Math.random() * 3
        : layer === 2
          ? 4 + Math.random() * 2
          : bright
            ? 6 + Math.random() * 3
            : 4.5 + Math.random() * 2.5;
    accents[i] = layer === 0 && Math.random() < 0.3 ? 1 : 0;
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

  return { count: n, starts, targets, delays, sizes, glyphs, accents, lums, normals, layers, dims };
}
