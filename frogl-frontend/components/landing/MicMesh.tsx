"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import { useMemo, useRef } from "react";
import type { Group } from "three";
import * as THREE from "three";

type MicMeshProps = {
  spinning?: boolean;
};

/** Mic solapa low-poly oscuro con bordes legibles sobre #212529. */
function LavalierMic({ spinning = true }: MicMeshProps) {
  const root = useRef<Group>(null);

  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2a2e33",
        metalness: 0.2,
        roughness: 0.55,
        flatShading: true,
      }),
    [],
  );
  const soft = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#3a3f46",
        metalness: 0.15,
        roughness: 0.6,
        flatShading: true,
      }),
    [],
  );
  const led = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff8fab",
        emissive: "#ff8fab",
        emissiveIntensity: 1.1,
        metalness: 0.1,
        roughness: 0.35,
        flatShading: true,
      }),
    [],
  );
  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1a1d21",
        metalness: 0.25,
        roughness: 0.45,
        flatShading: true,
      }),
    [],
  );

  useFrame((_, dt) => {
    if (!spinning || !root.current) return;
    root.current.rotation.y += dt * 0.45;
  });

  return (
    <group
      ref={root}
      rotation={[0.15, -0.35, 0.06]}
      position={[0, -0.55, 0]}
      scale={1.0}
    >
      <mesh position={[0, 1.15, 0]} material={soft} castShadow>
        <icosahedronGeometry args={[0.38, 0]} />
      </mesh>
      <mesh position={[0, 0.82, 0]} material={body} castShadow>
        <cylinderGeometry args={[0.12, 0.16, 0.22, 6]} />
      </mesh>
      <mesh position={[0, 0.15, 0]} material={body} castShadow>
        <cylinderGeometry args={[0.32, 0.34, 1.15, 8]} />
      </mesh>
      <mesh position={[0, 0.72, 0]} material={body} castShadow>
        <cylinderGeometry args={[0.32, 0.32, 0.12, 8]} />
      </mesh>
      <mesh position={[0, -0.42, 0]} material={body} castShadow>
        <cylinderGeometry args={[0.34, 0.3, 0.18, 8]} />
      </mesh>
      <mesh position={[0, 0.48, 0.34]} material={led} castShadow>
        <sphereGeometry args={[0.07, 6, 4]} />
      </mesh>
      <mesh position={[0, -0.05, 0.35]} material={accent} castShadow>
        <boxGeometry args={[0.22, 0.32, 0.06]} />
      </mesh>
      <mesh position={[0, 0.05, -0.38]} material={soft} castShadow>
        <boxGeometry args={[0.2, 0.55, 0.08]} />
      </mesh>
      <mesh position={[0, -0.12, -0.48]} material={accent} castShadow>
        <boxGeometry args={[0.16, 0.28, 0.06]} />
      </mesh>
    </group>
  );
}

export function MicScene({ spinning = true }: MicMeshProps) {
  return (
    <div className="h-full w-full">
      <Canvas
        camera={{ position: [0, 0.2, 4.6], fov: 34 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        shadows
        style={{ width: "100%", height: "100%", background: "transparent" }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight
          position={[3, 4, 3]}
          intensity={1.8}
          color="#ffffff"
          castShadow
        />
        <directionalLight
          position={[-3.5, 1.5, -2]}
          intensity={1.2}
          color="#a8b0ba"
        />
        <directionalLight position={[0, -2, 2]} intensity={0.4} color="#ff8fab" />
        <hemisphereLight args={["#9aa3ad", "#212529", 0.65]} />
        <LavalierMic spinning={spinning} />
        <ContactShadows
          position={[0, -1.85, 0]}
          opacity={0.45}
          scale={6}
          blur={2.4}
          far={3}
          color="#000"
        />
      </Canvas>
    </div>
  );
}
