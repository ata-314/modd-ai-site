import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshSurfaceSampler } from "three/examples/jsm/math/MeshSurfaceSampler.js";
import type { BuildingSample } from "@/components/three/sampleBuilding";
import { GLYPH_COUNT } from "@/components/three/glyphAtlas";

// Samples particle targets from a real 3D model (GLB) instead of the flat
// image silhouette. Drop the Meshy export at /public/models/building.glb and
// ExperienceCanvas picks it up automatically; the image sampler remains the
// fallback. Returns the same BuildingSample shape, so MorphField and the
// shader don't change — but targets now carry true depth, which makes the
// hold-phase rotation genuinely 3D.

export async function sampleModel(
  url: string,
  count: number,
  planeW: number
): Promise<BuildingSample> {
  const gltf = await new GLTFLoader().loadAsync(url);
  const scene = gltf.scene;
  scene.updateMatrixWorld(true);

  const meshes: THREE.Mesh[] = [];
  scene.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
  });
  if (meshes.length === 0) throw new Error("model has no meshes");

  // Normalize: center the model, scale its width to the shared plane width.
  const box = new THREE.Box3().setFromObject(scene);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const scale = planeW / Math.max(size.x, 1e-6);

  // Weight meshes by triangle count so dense parts get their share.
  const entries = meshes.map((mesh) => {
    const geo = mesh.geometry as THREE.BufferGeometry;
    const tris = (geo.index ? geo.index.count : geo.attributes.position.count) / 3;
    return { mesh, sampler: new MeshSurfaceSampler(mesh).build(), tris };
  });
  const totalTris = entries.reduce((s, e) => s + e.tris, 0);

  const n = count;
  const starts = new Float32Array(n * 3);
  const targets = new Float32Array(n * 3);
  const delays = new Float32Array(n);
  const sizes = new Float32Array(n);
  const glyphs = new Float32Array(n);
  const accents = new Float32Array(n);
  const lums = new Float32Array(n);

  const pos = new THREE.Vector3();
  const nor = new THREE.Vector3();
  const normalMatrix = new THREE.Matrix3();
  const light = new THREE.Vector3(0.5, 0.85, 0.6).normalize();

  for (let i = 0; i < n; i++) {
    // pick a mesh proportional to its triangle share
    let pick = Math.random() * totalTris;
    let entry = entries[0];
    for (const e of entries) {
      pick -= e.tris;
      if (pick <= 0) {
        entry = e;
        break;
      }
    }
    entry.sampler.sample(pos, nor);
    pos.applyMatrix4(entry.mesh.matrixWorld);
    normalMatrix.getNormalMatrix(entry.mesh.matrixWorld);
    nor.applyMatrix3(normalMatrix).normalize();

    const ny = (pos.y - box.min.y) / Math.max(size.y, 1e-6); // 0 base → 1 roof
    // roof planes, ledges and strongly side-facing surfaces read as edges
    const edge = Math.abs(nor.y) > 0.6 || Math.random() < 0.16;

    targets[i * 3] = (pos.x - center.x) * scale;
    targets[i * 3 + 1] = (pos.y - center.y) * scale;
    targets[i * 3 + 2] = (pos.z - center.z) * scale;

    starts[i * 3] = (Math.random() - 0.5) * planeW * 1.7;
    starts[i * 3 + 1] = (Math.random() - 0.5) * planeW;
    starts[i * 3 + 2] = (Math.random() - 0.5) * 3.2;

    // roof first, edges before fills — same choreography as the image path
    delays[i] = Math.min(
      0.6,
      (1 - ny) * 0.38 + (edge ? 0 : 0.14) + Math.random() * 0.07
    );
    sizes[i] = edge ? 7 + Math.random() * 4 : 5 + Math.random() * 3;
    glyphs[i] = Math.floor(Math.random() * GLYPH_COUNT);
    accents[i] = (edge ? Math.random() < 0.22 : Math.random() < 0.04) ? 1 : 0;
    // fake key light: glyph brightness follows surface orientation
    lums[i] = 0.22 + 0.78 * Math.max(nor.dot(light), 0);
  }

  // The GLTF lives only long enough to be sampled.
  scene.traverse((o) => {
    const mesh = o as THREE.Mesh;
    if (mesh.isMesh) {
      mesh.geometry.dispose();
      const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
      mats.forEach((m) => {
        const std = m as THREE.MeshStandardMaterial;
        std.map?.dispose();
        std.normalMap?.dispose();
        std.roughnessMap?.dispose();
        std.metalnessMap?.dispose();
        m.dispose();
      });
    }
  });

  return { count: n, starts, targets, delays, sizes, glyphs, accents, lums };
}
