"use client";

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface Props {
  progressRef: React.RefObject<number>;
  mouseRef: React.RefObject<{ x: number; y: number }>;
}

// Scroll dolly + damped mouse parallax. Rotation stays within a few degrees
// and calms down as the sequence completes.
export default function CameraRig({ progressRef, mouseRef }: Props) {
  const { camera } = useThree();

  useFrame((_, delta) => {
    const p = progressRef.current ?? 0;
    const ease = p * p * (3 - 2 * p);
    const targetZ = THREE.MathUtils.lerp(7.3, 5.6, ease);

    const calm = 1 - p * 0.55;
    const m = mouseRef.current ?? { x: 0, y: 0 };
    const targetX = m.x * 0.28 * calm;
    const targetY = -m.y * 0.16 * calm;

    camera.position.z = THREE.MathUtils.damp(camera.position.z, targetZ, 3, delta);
    camera.position.x = THREE.MathUtils.damp(camera.position.x, targetX, 2.5, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, targetY, 2.5, delta);
    camera.lookAt(0, 0, 0);
  });

  return null;
}
