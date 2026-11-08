import React, { useLayoutEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { spring } from "remotion";

const PARTICLES = 850;
const KNOT_POSITION: [number, number, number] = [1.55, 0.02, 0];

/** Small deterministic PRNG so every render produces the same star field. */
const mulberry32 = (seed: number) => {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const CameraRig: React.FC<{ x: number; y: number; z: number }> = ({
  x,
  y,
  z,
}) => {
  const camera = useThree((state) => state.camera);
  useLayoutEffect(() => {
    camera.position.set(x, y, z);
  }, [camera, x, y, z]);
  return null;
};

const ORBS = [
  { phase: 0, speed: 0.85, radius: 2.1, color: "#22d3ee", size: 0.075 },
  { phase: (Math.PI * 2) / 3, speed: 0.72, radius: 2.35, color: "#f472b6", size: 0.06 },
  { phase: (Math.PI * 4) / 3, speed: 0.95, radius: 2.0, color: "#a78bfa", size: 0.055 },
];

export const ThreeScene: React.FC<{ frame: number; fps: number }> = ({
  frame,
  fps,
}) => {
  const t = frame / fps;

  const particlePositions = useMemo(() => {
    const rand = mulberry32(20261108);
    const positions = new Float32Array(PARTICLES * 3);
    for (let i = 0; i < PARTICLES; i++) {
      const theta = rand() * Math.PI * 2;
      const u = rand() * 2 - 1;
      const radius = 1.95 + rand() * 1.55;
      const ring = Math.sqrt(1 - u * u);
      positions[i * 3] = Math.cos(theta) * ring * radius;
      positions[i * 3 + 1] = u * radius * 0.72;
      positions[i * 3 + 2] = Math.sin(theta) * ring * radius;
    }
    return positions;
  }, []);

  const appear = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 70, mass: 0.9 },
  });
  const scale = 0.78 + appear * 0.3;

  const cameraX = Math.sin(t * 0.3) * 0.14;
  const cameraY = 0.18 + Math.cos(t * 0.42) * 0.09;
  const cameraZ = 7.2 + Math.sin(t * 0.5) * 0.16;

  return (
    <>
      <ambientLight intensity={0.42} color="#c7d2fe" />
      <directionalLight position={[5, 7, 6]} intensity={2.3} color="#ffffff" />
      <pointLight
        position={[-3.5, -2.4, 3.5]}
        intensity={32}
        color="#22d3ee"
        distance={18}
        decay={2}
      />
      <pointLight
        position={[4, 2, 4]}
        intensity={48}
        color="#a855f7"
        distance={22}
        decay={2}
      />
      <pointLight
        position={[-3, 3, -2]}
        intensity={30}
        color="#f472b6"
        distance={18}
        decay={2}
      />

      <CameraRig x={cameraX} y={cameraY} z={cameraZ} />

      <group
        position={[
          KNOT_POSITION[0],
          KNOT_POSITION[1] + Math.sin(t * 0.8) * 0.05,
          KNOT_POSITION[2],
        ]}
        scale={scale}
      >
        {/* Main object: a polished torus knot with a slight wobble. */}
        <mesh
          rotation={[
            0.16 + Math.sin(t * 0.6) * 0.08,
            t * 0.52,
            -0.08 + Math.cos(t * 0.45) * 0.05,
          ]}
        >
          <torusKnotGeometry args={[1.02, 0.33, 200, 32]} />
          <meshStandardMaterial
            color="#6d4aff"
            metalness={0.62}
            roughness={0.2}
            emissive="#1b1060"
            emissiveIntensity={0.95}
          />
        </mesh>

        {/* Glowing core, visible through the knot. */}
        <mesh>
          <sphereGeometry args={[0.24, 32, 32]} />
          <meshBasicMaterial color="#a5f3fc" toneMapped={false} />
        </mesh>
        <mesh scale={2.9}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshBasicMaterial
            color="#22d3ee"
            transparent
            opacity={0.16}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>

        {/* Orbit rings. */}
        <mesh rotation={[Math.PI / 2.35, t * 0.22, 0.28]}>
          <torusGeometry args={[2.18, 0.0045, 8, 220]} />
          <meshBasicMaterial
            color="#67e8f9"
            transparent
            opacity={0.5}
            toneMapped={false}
          />
        </mesh>
        <mesh rotation={[Math.PI / 1.75, -t * 0.16, -0.5]}>
          <torusGeometry args={[2.55, 0.0035, 8, 220]} />
          <meshBasicMaterial
            color="#a78bfa"
            transparent
            opacity={0.3}
            toneMapped={false}
          />
        </mesh>

        {/* Orbiting signal dots. */}
        {ORBS.map((orb, i) => {
          const angle = t * orb.speed + orb.phase;
          const x = Math.cos(angle) * orb.radius;
          const z = Math.sin(angle) * orb.radius;
          const y = Math.sin(angle * 1.4 + orb.phase) * 0.62;
          return (
            <group key={i} position={[x, y, z]}>
              <mesh>
                <sphereGeometry args={[orb.size, 16, 16]} />
                <meshBasicMaterial color={orb.color} toneMapped={false} />
              </mesh>
              <mesh scale={3.1}>
                <sphereGeometry args={[orb.size, 12, 12]} />
                <meshBasicMaterial
                  color={orb.color}
                  transparent
                  opacity={0.18}
                  blending={THREE.AdditiveBlending}
                  depthWrite={false}
                  toneMapped={false}
                />
              </mesh>
            </group>
          );
        })}

        {/* Wireframe cage. */}
        <mesh rotation={[0.1, -t * 0.09, 0.05]}>
          <icosahedronGeometry args={[2.25, 1]} />
          <meshBasicMaterial
            wireframe
            color="#8b5cf6"
            transparent
            opacity={0.09}
            toneMapped={false}
          />
        </mesh>

        {/* Star field. */}
        <points rotation={[0, -t * 0.05, 0]}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[particlePositions, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.032}
            color="#c4b5fd"
            transparent
            opacity={0.8}
            sizeAttenuation
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            toneMapped={false}
          />
        </points>
      </group>
    </>
  );
};
