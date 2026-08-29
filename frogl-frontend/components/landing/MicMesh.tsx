"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Sparkles } from "@react-three/drei";
import {
  Bloom,
  EffectComposer,
  ChromaticAberration,
} from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Group, PointLight } from "three";
import * as THREE from "three";
import { MicFallback } from "@/components/landing/MicFallback";
import {
  WebGLErrorBoundary,
  canUseWebGL,
} from "@/components/landing/WebGLGuard";

type MicMeshProps = {
  spinning?: boolean;
};

function LavalierMic({ spinning = true }: MicMeshProps) {
  const root = useRef<Group>(null);
  const flare = useRef<PointLight>(null);

  const body = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#32383f",
        metalness: 0.55,
        roughness: 0.35,
        flatShading: true,
      }),
    [],
  );
  const soft = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#4a515a",
        metalness: 0.4,
        roughness: 0.4,
        flatShading: true,
      }),
    [],
  );
  const led = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff8fab",
        emissive: "#ff8fab",
        emissiveIntensity: 2.2,
        metalness: 0.1,
        roughness: 0.25,
        flatShading: true,
      }),
    [],
  );
  const accent = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#1e2228",
        metalness: 0.45,
        roughness: 0.4,
        flatShading: true,
      }),
    [],
  );
  const highlight = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#d8dde4",
        metalness: 0.85,
        roughness: 0.18,
        flatShading: true,
        emissive: "#8892a0",
        emissiveIntensity: 0.15,
      }),
    [],
  );

  useFrame((state, dt) => {
    if (spinning && root.current) {
      root.current.rotation.y += dt * 0.45;
    }
    if (flare.current) {
      const t = state.clock.elapsedTime;
      flare.current.intensity = 1.4 + Math.sin(t * 2.2) * 0.55;
    }
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
      {/* destello en el borde de la cabeza */}
      <mesh position={[0.22, 1.28, 0.22]} material={highlight}>
        <octahedronGeometry args={[0.06, 0]} />
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
      <pointLight
        ref={flare}
        position={[0.35, 1.4, 0.55]}
        color="#fff4e8"
        intensity={1.6}
        distance={4}
        decay={2}
      />
      <pointLight
        position={[0, 0.48, 0.5]}
        color="#ff8fab"
        intensity={1.2}
        distance={2.5}
        decay={2}
      />
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
  const [ok, setOk] = useState(true);

  useEffect(() => {
    if (!canUseWebGL()) setOk(false);
  }, []);

  if (!ok) return <MicFallback />;

  return (
    <div className="mic-scene-mask h-full w-full">
      <WebGLErrorBoundary fallback={<MicFallback />}>
        <Canvas
          camera={{ position: [0, 0.2, 4.6], fov: 34 }}
          dpr={[1, 1.5]}
          gl={{
            antialias: true,
            alpha: true,
            toneMapping: THREE.ACESFilmicToneMapping,
            powerPreference: "default",
            failIfMajorPerformanceCaveat: false,
          }}
          shadows
          style={{ width: "100%", height: "100%", background: "transparent" }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          onError={() => setOk(false)}
        >
          <ambientLight intensity={0.35} />
          <directionalLight
            position={[3.2, 4.5, 2.8]}
            intensity={2.2}
            color="#fff8f0"
            castShadow
          />
          <directionalLight
            position={[-3.5, 1.5, -2]}
            intensity={0.9}
            color="#9eb0c8"
          />
          <spotLight
            position={[1.5, 3.5, 2]}
            angle={0.35}
            penumbra={0.7}
            intensity={2.4}
            color="#ffe8d2"
            castShadow
          />
          <hemisphereLight args={["#b8c0cc", "#121416", 0.45]} />
          <Sparkles
            count={28}
            scale={[3.2, 3.5, 2]}
            size={2.5}
            speed={0.25}
            opacity={0.45}
            color="#ffd6e0"
          />
          <LavalierMic spinning={spinning} />
          <ContactShadows
            position={[0, -1.85, 0]}
            opacity={0.55}
            scale={6}
            blur={2.8}
            far={3}
            color="#000"
          />
          <EffectComposer multisampling={0}>
            <Bloom
              intensity={1.15}
              luminanceThreshold={0.35}
              luminanceSmoothing={0.4}
              mipmapBlur
            />
            <ChromaticAberration
              blendFunction={BlendFunction.NORMAL}
              offset={new THREE.Vector2(0.0004, 0.0004)}
            />
          </EffectComposer>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

